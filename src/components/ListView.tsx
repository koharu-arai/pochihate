"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useStore } from "@/lib/store";
import { DAY_MS, RECHECK_DAYS, band, fmtDate, yen } from "@/lib/scoring";
import type { Item, Status } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const toneText = { good: "text-good", warn: "text-warn", bad: "text-bad" } as const;

export function ListView() {
  const router = useRouter();
  const { items, putItem, startRecheck, toast } = useStore();
  const now = Date.now();
  const waiting = items.filter((i) => i.status === "waiting").sort((a, b) => (a.recheckAt ?? 0) - (b.recheckAt ?? 0));
  const done = items.filter((i) => i.status !== "waiting");
  const pending = waiting.reduce((s, i) => s + i.price, 0);
  const saved = items.filter((i) => i.status === "skipped").reduce((s, i) => s + i.price, 0);

  function recheck(it: Item) {
    startRecheck(it.id);
    router.push("/");
  }
  function decide(it: Item, status: Exclude<Status, "waiting">) {
    const copy = structuredClone(it);
    copy.status = status;
    copy.decidedAt = Date.now();
    const last = copy.history.at(-1);
    if (last) last.status = status;
    putItem(copy);
    toast(status === "bought" ? "「買った」に移しました" : `見送りました。${yen(it.price)}を守りました`);
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        <Stat label="保留中" value={`${waiting.length}件`} />
        <Stat label="保留中の金額" value={yen(pending)} />
        <Stat label="見送って守った" value={yen(saved)} />
      </div>

      {waiting.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-muted-foreground">
          <b className="mb-1 block text-foreground">30日リストは空です</b>
          判定結果の画面で「30日後にもう一回判定する」を押すと、ここに並びます。
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {waiting.map((it, idx) => {
            const recheckAt = it.recheckAt ?? now;
            const due = now >= recheckAt;
            const left = Math.max(0, Math.ceil((recheckAt - now) / DAY_MS));
            const pct = Math.min(100, Math.max(0, ((now - (recheckAt - RECHECK_DAYS * DAY_MS)) / (RECHECK_DAYS * DAY_MS)) * 100));
            const b = band(it.score);
            return (
              <motion.article
                key={it.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className={cn(
                  "flex flex-col gap-2.5 rounded-2xl border bg-card px-4 py-3.5",
                  due ? "border-tag ring-2 ring-tag/40" : "border-border",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-base font-bold break-words">{it.name}</h3>
                    <span className="font-mono text-[13px] text-muted-foreground tabular-nums">{yen(it.price)}</span>
                  </div>
                  <span className={cn("shrink-0 font-display text-[22px] tabular-nums", toneText[b.tone])}>
                    {it.score}
                    <small className="ml-0.5 font-sans text-[11px] text-muted-foreground">点</small>
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-[13px]">
                  <span>{due ? "再判定の日です" : `あと${left}日`}</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                    <i className="block h-full bg-tag" style={{ width: `${pct}%` }} />
                  </span>
                  <span className="text-xs text-muted-foreground">{fmtDate(recheckAt)}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {due && (
                    <Button size="sm" onClick={() => recheck(it)}>
                      もう一回判定する
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => decide(it, "bought")}>
                    買った
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => decide(it, "skipped")}>
                    やめた
                  </Button>
                  {!due && (
                    <Button variant="link" onClick={() => recheck(it)}>
                      今すぐ再判定
                    </Button>
                  )}
                </div>
              </motion.article>
            );
          })}
        </div>
      )}

      {done.length > 0 && (
        <Link href="/history" className="self-center text-xs text-muted-foreground underline underline-offset-4">
          決めたもの {done.length}件は「履歴」にあります
        </Link>
      )}
    </>
  );
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-card px-3 py-2.5">
      <span className="block text-[11px] text-muted-foreground">{label}</span>
      <b className="font-mono text-base whitespace-nowrap tabular-nums">{value}</b>
    </div>
  );
}
