"use client";

import { Fragment, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { useStore } from "@/lib/store";
import { band, shouldShowPerUse, yen } from "@/lib/scoring";
import type { HistoryEntry, Item, Status } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Receipt } from "@/components/Receipt";
import { Stat } from "@/components/ListView";
import { cn } from "@/lib/utils";

type Filter = "all" | Status;
const FILTERS: [Filter, string][] = [
  ["all", "すべて"],
  ["waiting", "保留中"],
  ["bought", "買った"],
  ["skipped", "やめた"],
];
const STATUS: Record<Status, { label: string; tone: "good" | "warn" | "bad" }> = {
  waiting: { label: "保留", tone: "warn" },
  bought: { label: "買った", tone: "good" },
  skipped: { label: "やめた", tone: "bad" },
};
const toneText = { good: "text-good", warn: "text-warn", bad: "text-bad" } as const;
const WEEK = ["日", "月", "火", "水", "木", "金", "土"];

type Row = { it: Item; e: HistoryEntry; idx: number; status: Status; prev: number | null };

export function HistoryView() {
  const { items, settings, removeItem, toast } = useStore();
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<string | null>(null);
  const [armed, setArmed] = useState<string | null>(null);

  const rows: Row[] = items
    .flatMap((it) =>
      it.history.map((e, idx) => ({
        it,
        e,
        idx,
        status: idx === it.history.length - 1 ? it.status : e.status,
        prev: idx > 0 ? it.history[idx - 1].score : null,
      })),
    )
    .sort((a, b) => b.e.at - a.e.at);
  const shown = filter === "all" ? rows : rows.filter((r) => r.it.status === filter);

  const bought = items.filter((i) => i.status === "bought");
  const skipped = items.filter((i) => i.status === "skipped");
  const sum = (arr: Item[]) => arr.reduce((s, i) => s + i.price, 0);
  const avg = rows.length ? Math.round(rows.reduce((s, r) => s + r.e.score, 0) / rows.length) : null;

  // 月ごとにまとめる
  const groups: { month: string; rows: Row[] }[] = [];
  for (const r of shown) {
    const d = new Date(r.e.at);
    const m = `${d.getFullYear()}年${d.getMonth() + 1}月`;
    if (groups.at(-1)?.month !== m) groups.push({ month: m, rows: [] });
    groups.at(-1)!.rows.push(r);
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <Stat label="判定した回数" value={`${rows.length}回`} />
        <Stat label="平均スコア" value={avg === null ? "—" : `${avg}点`} />
        <Stat label={`買った(${bought.length}件)`} value={yen(sum(bought))} />
        <Stat label={`見送って守った(${skipped.length}件)`} value={yen(sum(skipped))} />
      </div>

      <div className="flex flex-wrap gap-1.5" role="group" aria-label="絞り込み">
        {FILTERS.map(([k, label]) => (
          <button
            key={k}
            type="button"
            aria-pressed={filter === k}
            onClick={() => setFilter(k)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              filter === k ? "border-primary bg-primary-soft text-primary" : "border-border bg-card",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-muted-foreground">
          <b className="mb-1 block text-foreground">まだ履歴はありません</b>
          判定して「30日後にもう一回」「買う」「買わない」のどれかを押すと、ここに日付つきで残ります。
        </div>
      ) : shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-muted-foreground">この条件の履歴はありません</div>
      ) : (
        groups.map((g) => (
          <Fragment key={g.month}>
            <p className="-mb-1 font-mono text-xs tracking-[0.06em] text-muted-foreground">{g.month}</p>
            <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
              {g.rows.map((r) => {
                const key = `${r.it.id}-${r.idx}`;
                const isOpen = open === key;
                const d = new Date(r.e.at);
                const b = band(r.e.score);
                const st = STATUS[r.status];
                return (
                  <div key={key}>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setOpen(isOpen ? null : key)}
                      className="grid w-full grid-cols-[44px_1fr_auto] items-center gap-2.5 px-3.5 py-3 text-left"
                    >
                      <span className="font-mono text-xs leading-tight text-muted-foreground">
                        {d.getMonth() + 1}/{d.getDate()}
                        <br />
                        {WEEK[d.getDay()]}
                      </span>
                      <span className="min-w-0">
                        <b className="block truncate">{r.it.name}</b>
                        <span className="font-mono text-xs text-muted-foreground">
                          {yen(r.it.price)}
                          {r.idx > 0 && ` ・ ${r.idx + 1}回目の判定`}
                        </span>
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="flex flex-col items-end gap-0.5">
                          <b className={cn("font-display text-lg leading-none font-normal", toneText[b.tone])}>{r.e.score}</b>
                          <Badge tone={st.tone} className="px-2.5 font-normal">
                            {st.label}
                          </Badge>
                        </span>
                        <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                      </span>
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="flex flex-col gap-2.5 px-3.5 pb-3.5">
                            {r.prev !== null && (
                              <span className="font-mono text-[13px] text-muted-foreground">
                                前回 <strong className="text-foreground">{r.prev}点</strong> → <strong className="text-foreground">{r.e.score}点</strong>(
                                {r.e.score - r.prev >= 0 ? "+" : ""}
                                {r.e.score - r.prev})
                              </span>
                            )}
                            {r.e.answers.reason && (
                              <p className="text-sm">
                                <span className="text-xs text-muted-foreground">欲しい理由:</span> {r.e.answers.reason}
                              </p>
                            )}
                            <p className="text-sm">{r.e.comment}</p>
                            <Receipt answers={r.e.answers} result={r.e.result} title={false} showPerUse={shouldShowPerUse(settings.perUseMode, r.it.price)} />
                            <Button
                              variant={armed === r.it.id ? "destructive" : "link"}
                              className="self-start"
                              onClick={() => {
                                if (armed !== r.it.id) return setArmed(r.it.id);
                                removeItem(r.it.id);
                                setArmed(null);
                                toast("削除しました");
                              }}
                            >
                              {armed === r.it.id ? "もう一度押すと削除します" : `「${r.it.name}」を履歴から削除`}
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </Fragment>
        ))
      )}
    </>
  );
}
