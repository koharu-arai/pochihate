"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Clock, X } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  DAY_MS,
  QUESTIONS,
  RECHECK_DAYS,
  band,
  calc,
  fmtDate,
  liveHint,
  ruleComment,
  shouldShowPerUse,
  yen,
} from "@/lib/scoring";
import type { Answers, FilledAnswers, HistoryEntry, Item, Result, Status } from "@/lib/types";
import { newId } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PriceTag } from "@/components/PriceTag";
import { Receipt } from "@/components/Receipt";
import { cn } from "@/lib/utils";

const EXAMPLE = { name: "MacBook Air", price: 150000 };
const EMPTY: Answers = { reason: "", want: null, vanity: null, need: null, irreplace: null, freq: null, perUse: null, months: null, savings: null };

type Step = "intro" | "q" | "result";
type Draft = {
  itemId: string | null;
  name: string;
  price: string;
  isExample: boolean;
  answers: Answers;
  prevScore: number | null;
};

function draftFrom(item: Item | null): Draft {
  const last = item?.history.at(-1);
  return {
    itemId: item?.id ?? null,
    name: item?.name ?? EXAMPLE.name,
    price: String(item?.price ?? EXAMPLE.price),
    isExample: !item,
    answers: last ? { ...EMPTY, ...last.answers } : { ...EMPTY },
    prevScore: last?.score ?? null,
  };
}

function isAnswered(a: Answers, key: keyof Answers, type: string): boolean {
  if (type === "text") return true;
  const v = a[key];
  return typeof v === "number" && Number.isFinite(v) && v >= 0;
}

export function JudgeView() {
  const router = useRouter();
  const { items, settings, putItem, recheckId, startRecheck, toast } = useStore();
  const [step, setStep] = useState<Step>("intro");
  const [q, setQ] = useState(0);
  const [dir, setDir] = useState(1);
  const [draft, setDraft] = useState<Draft>(() => draftFrom(null));
  const [saved, setSaved] = useState<string | null>(null);

  // 30日リストから「もう一回判定」で来たとき
  useEffect(() => {
    if (!recheckId) return;
    const it = items.find((i) => i.id === recheckId);
    startRecheck(null);
    if (!it) return;
    setDraft(draftFrom(it));
    setStep("intro");
    setSaved(null);
  }, [recheckId, items, startRecheck]);

  const price = Number(draft.price);
  const savingsNum = settings.savings && settings.savings > 0 ? settings.savings : null;
  const canStart = draft.name.trim() !== "" && price > 0;

  const filled = useMemo<FilledAnswers | null>(() => {
    const a = draft.answers;
    if ([a.want, a.vanity, a.need, a.irreplace, a.freq, a.perUse, a.months].some((v) => v === null)) return null;
    return a as FilledAnswers;
  }, [draft.answers]);
  const result = useMemo<Result | null>(() => (step === "result" && filled ? calc(price, filled) : null), [step, filled, price]);

  const setAnswer = <K extends keyof Answers>(k: K, v: Answers[K]) => setDraft((d) => ({ ...d, answers: { ...d.answers, [k]: v } }));

  function start() {
    if (!canStart) return;
    setDraft((d) => ({ ...d, name: d.name.trim(), answers: { ...d.answers, savings: savingsNum } }));
    setQ(0);
    setDir(1);
    setStep("q");
  }

  function save(status: Status) {
    if (!filled || !result) return;
    const now = Date.now();
    const existing = draft.itemId ? items.find((i) => i.id === draft.itemId) : undefined;
    const entry: HistoryEntry = { at: now, score: result.score, status, answers: { ...filled }, comment: ruleComment(filled, result), result };
    const item: Item = existing
      ? structuredClone(existing)
      : { id: newId(), name: draft.name, price, createdAt: now, status, score: result.score, recheckAt: null, decidedAt: null, history: [] };
    item.name = draft.name;
    item.price = price;
    item.history.push(entry);
    item.status = status;
    item.score = result.score;
    item.decidedAt = status === "waiting" ? null : now;
    item.recheckAt = status === "waiting" ? now + RECHECK_DAYS * DAY_MS : item.recheckAt;
    putItem(item);
    setSaved(
      status === "waiting"
        ? `${fmtDate(item.recheckAt!)}にもう一度聞きます`
        : status === "bought"
          ? "「買った」として記録しました"
          : `見送りました。${yen(price)}を使わずに済みました`,
    );
    toast(status === "waiting" ? "30日リストに追加しました" : "記録しました");
  }

  function newJudge() {
    setDraft({ ...draftFrom(null), name: "", price: "", isExample: false });
    setSaved(null);
    setStep("intro");
  }

  /* ---------- 入力 ---------- */
  if (step === "intro") {
    const ratio = savingsNum && price > 0 ? price / savingsNum : null;
    return (
      <>
        <Card>
          <div className="flex flex-col gap-1">
            <span className="text-xs tracking-[0.08em] text-muted-foreground">STEP 0</span>
            <h2 className="text-xl font-bold">迷っているものは？</h2>
          </div>
          {draft.isExample && <Note>入力例が入っています。書き換えて始めてください。</Note>}
          {draft.prevScore !== null && <Note>再判定です。前回は{draft.prevScore}点でした。</Note>}
          <Field label="商品名" id="in-name">
            <input
              id="in-name"
              className={inputCls}
              value={draft.name}
              autoComplete="off"
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value, isExample: false }))}
            />
          </Field>
          <Field label="価格" id="in-price">
            <YenInput id="in-price" value={draft.price} step={100} onChange={(v) => setDraft((d) => ({ ...d, price: v, isExample: false }))} />
          </Field>
          <div className="flex items-center justify-between gap-3 rounded-[10px] bg-background px-3 py-2.5 text-[13px]">
            <span className="min-w-0">
              {savingsNum === null ? (
                <span className="text-muted-foreground">貯金が未設定です。設定すると「貯金への負担」も点数に入ります</span>
              ) : (
                <>
                  <span className="text-muted-foreground">今の貯金 </span>
                  <b className="font-mono tabular-nums">{yen(savingsNum)}</b>
                  {ratio !== null && (
                    <span className={cn("ml-1.5 text-xs", ratio > 1 ? "text-bad" : "text-muted-foreground")}>
                      {ratio > 1 ? "貯金を超えています(最大59点)" : `この買い物で${Math.round(ratio * 100)}%`}
                    </span>
                  )}
                </>
              )}
            </span>
            <Link href="/settings" className="shrink-0 text-xs text-primary underline underline-offset-4">
              {savingsNum === null ? "設定する" : "変更"}
            </Link>
          </div>
          <Button className="w-full" disabled={!canStart} onClick={start}>
            質問に答える({QUESTIONS.length}問)
          </Button>
        </Card>
        <Card className="gap-2">
          <span className="text-xs tracking-[0.08em] text-muted-foreground">しくみ</span>
          <p>
            欲しい度・必要度・代用できるか・使用頻度・元が取れるまでの期間・貯金への負担を数値にして、100点満点の「購入理由スコア」を出します。決めきれなければ30日後にもう一度判定できます。
          </p>
          <Link href="/about" className="self-start text-xs text-primary underline underline-offset-4">
            点数の決め方を見る
          </Link>
        </Card>
      </>
    );
  }

  /* ---------- 質問 ---------- */
  if (step === "q") {
    const Q = QUESTIONS[q];
    const v = draft.answers[Q.key];
    const ok = isAnswered(draft.answers, Q.key, Q.type);
    const isLast = q === QUESTIONS.length - 1;
    const go = (d: number) => {
      setDir(d);
      if (d < 0 && q === 0) return setStep("intro");
      if (d > 0 && isLast) return setStep("result");
      setQ(q + d);
    };
    const hint = Q.type === "number" ? liveHint(Q.key, draft.answers as Partial<FilledAnswers>, price) : "";
    return (
      <Card className="overflow-hidden">
        <div className="h-1 overflow-hidden rounded-full bg-border">
          <motion.i className="block h-full bg-primary" animate={{ width: `${(q / QUESTIONS.length) * 100}%` }} />
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="min-w-0 truncate text-[13px] text-muted-foreground">
            {draft.name} ・ {yen(price)}
          </span>
          <span className="shrink-0 font-mono text-xs text-muted-foreground">
            Q{q + 1} / {QUESTIONS.length}
          </span>
        </div>
        {draft.prevScore !== null && q === 0 && <Note>前回の回答が入っています。今の気持ちで直してください。</Note>}
        <AnimatePresence mode="wait" initial={false} custom={dir}>
          <motion.div
            key={q}
            custom={dir}
            initial={{ opacity: 0, x: dir * 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -24 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col gap-3.5"
          >
            <h2 className="text-xl leading-snug font-bold">{Q.title}</h2>
            {Q.hint && <p className="-mt-1.5 text-xs text-muted-foreground">{Q.hint}</p>}

            {Q.type === "text" && (
              <textarea
                autoFocus
                className={cn(inputCls, "min-h-[84px] resize-y")}
                placeholder={Q.placeholder}
                value={draft.answers.reason}
                onChange={(e) => setAnswer("reason", e.target.value)}
              />
            )}

            {Q.type === "scale" && (
              <>
                <div className="grid grid-cols-11 gap-1" role="group" aria-label={Q.title}>
                  {Array.from({ length: 11 }, (_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-pressed={v === i}
                      onClick={() => setAnswer(Q.key, i)}
                      className={cn(
                        "rounded-lg border py-2.5 font-mono text-sm tabular-nums transition-colors",
                        v === i ? "border-foreground bg-foreground text-card" : "border-border bg-background hover:border-muted-foreground",
                      )}
                    >
                      {i}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between gap-3 text-xs text-muted-foreground">
                  <span>0 = {Q.lo}</span>
                  <span className="text-right">10 = {Q.hi}</span>
                </div>
              </>
            )}

            {Q.type === "number" && (
              <>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={Q.step}
                    placeholder="0"
                    className={cn(inputCls, "max-w-[140px] font-mono text-lg tabular-nums")}
                    value={typeof v === "number" ? v : ""}
                    onChange={(e) => setAnswer(Q.key, e.target.value === "" ? null : Number(e.target.value))}
                  />
                  <span>{Q.unit}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Q.chips.map(([label, n]) => (
                    <button
                      key={label}
                      type="button"
                      aria-pressed={v === n}
                      onClick={() => setAnswer(Q.key, n)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-[13px] transition-colors",
                        v === n ? "border-primary bg-primary-soft text-primary" : "border-border bg-background",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {hint && <div className="rounded-lg bg-background px-2.5 py-2 font-mono text-[13px] text-muted-foreground">{hint}</div>}
              </>
            )}
          </motion.div>
        </AnimatePresence>
        <div className="flex gap-2.5">
          <Button variant="outline" className="flex-1" onClick={() => go(-1)}>
            <ArrowLeft /> {q === 0 ? "戻る" : "前へ"}
          </Button>
          <Button className="flex-1" disabled={!ok} onClick={() => go(1)}>
            {isLast ? "結果を見る" : Q.type === "text" && !draft.answers.reason ? "スキップ" : "次へ"} {!isLast && <ArrowRight />}
          </Button>
        </div>
      </Card>
    );
  }

  /* ---------- 結果 ---------- */
  if (!result || !filled) return null;
  const b = band(result.score);
  const delta = draft.prevScore !== null ? result.score - draft.prevScore : null;
  return (
    <>
      <Card>
        <div className="grid items-center gap-[18px] max-[420px]:justify-items-center max-[420px]:text-center min-[421px]:grid-cols-[auto_1fr]">
          <PriceTag score={result.score} />
          <div className="flex min-w-0 flex-col gap-1.5 max-[420px]:items-center">
            <Badge tone={b.tone}>{b.label}</Badge>
            <h2 className="text-[17px] font-bold break-words">{draft.name}</h2>
            <span className="font-mono text-[13px] text-muted-foreground">{yen(price)}</span>
            {delta !== null && (
              <span className="font-mono text-[13px] text-muted-foreground">
                30日前 <strong className="text-foreground">{draft.prevScore}点</strong> → 今回 <strong className="text-foreground">{result.score}点</strong>(
                {delta >= 0 ? "+" : ""}
                {delta})
              </span>
            )}
          </div>
        </div>
        <p className="text-base leading-[1.75] font-medium">{ruleComment(filled, result)}</p>
      </Card>

      <Receipt answers={filled} result={result} showPerUse={shouldShowPerUse(settings.perUseMode, price)} />

      <section className="flex flex-col gap-2.5">
        {saved ? (
          <>
            <Note className="text-center">{saved}</Note>
            <Button className="w-full" onClick={() => router.push("/list")}>
              30日リストを見る
            </Button>
            <Button variant="outline" className="w-full" onClick={newJudge}>
              別のものを判定する
            </Button>
          </>
        ) : (
          <>
            <Button className="w-full" onClick={() => save("waiting")}>
              <Clock /> 30日後にもう一回判定する
            </Button>
            <div className="flex gap-2.5">
              <Button variant="outline" className="flex-1" onClick={() => save("bought")}>
                <Check /> 買う
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => save("skipped")}>
                <X /> 買わない
              </Button>
            </div>
            <Button
              variant="link"
              className="self-center"
              onClick={() => {
                setQ(1);
                setDir(-1);
                setStep("q");
              }}
            >
              回答を直す
            </Button>
          </>
        )}
      </section>
    </>
  );
}

const inputCls =
  "w-full rounded-[10px] border border-border bg-background px-3 py-2.5 text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25";

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

function YenInput({ id, value, onChange, step, placeholder }: { id: string; value: string; onChange: (v: string) => void; step: number; placeholder?: string }) {
  return (
    <div className="relative">
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={0}
        step={step}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(inputCls, "pr-9 font-mono text-lg tabular-nums")}
      />
      <span className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground">円</span>
    </div>
  );
}

function Note({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("rounded-lg bg-primary-soft px-2.5 py-1.5 text-xs text-muted-foreground", className)}>{children}</p>;
}
