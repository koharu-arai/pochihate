import { LABELS, WEIGHTS, fmtMonths, yen } from "@/lib/scoring";
import type { FilledAnswers, PartKey, Result } from "@/lib/types";
import { cn } from "@/lib/utils";

function Row({ label, value, minus }: { label: React.ReactNode; value: React.ReactNode; minus?: boolean }) {
  return (
    <div className="flex justify-between gap-3 py-0.5">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("text-right", minus && "text-bad")}>{value}</span>
    </div>
  );
}
const Sep = () => <div className="my-2 border-t border-dashed border-border" />;

/** レシート風の内訳 */
export function Receipt({
  answers: a,
  result: r,
  title = true,
  showPerUse = false,
}: {
  answers: FilledAnswers;
  result: Result;
  title?: boolean;
  showPerUse?: boolean;
}) {
  const keys = Object.keys(r.parts) as PartKey[];
  return (
    <section
      aria-label="内訳"
      className="receipt rounded border border-border bg-card px-[18px] pt-[18px] pb-[22px] font-mono text-[13px] tabular-nums"
    >
      {title && <h3 className="mb-2.5 text-center text-xs font-semibold tracking-[0.12em]">*** 内 訳 ***</h3>}
      {keys.map((k) => {
        const v = Math.round(r.parts[k] ?? 0);
        return (
          <div key={k} className="grid grid-cols-[1fr_70px_40px] items-center gap-2 py-[5px]">
            <span>
              {LABELS[k]} <span className="text-muted-foreground">×{WEIGHTS[k]}</span>
            </span>
            <span className="h-1.5 overflow-hidden rounded-full bg-border">
              <i className="block h-full bg-foreground" style={{ width: `${v}%` }} />
            </span>
            <span className="text-right">{v}</span>
          </div>
        );
      })}
      <Sep />
      <Row label="月あたりの価値" value={yen(r.monthlyValue)} />
      <Row label="元が取れるまで" value={fmtMonths(r.payback)} />
      {showPerUse && r.perUseCost !== undefined && <Row label="1回あたりのコスト" value={yen(r.perUseCost)} />}
      <Row label="使う予定" value={`${a.months}ヶ月 / 週${a.freq}回`} />
      {r.savingsRatio !== null && a.savings ? (
        <Row label="貯金に対する割合" value={`${Math.round(r.savingsRatio * 100)}%(${yen(a.savings)}中)`} />
      ) : (
        <Row label="貯金" value="未設定(マイページで設定できます)" />
      )}
      <Sep />
      <Row label="加重平均" value={r.base.toFixed(1)} />
      <Row label={`自己満度 ${a.vanity}/10`} value={`−${r.penalty.toFixed(1)}`} minus />
      {r.overSavings && <Row label="貯金オーバーのため上限" value="59" minus />}
      <Sep />
      <div className="flex justify-between pt-1 text-[15px] font-semibold">
        <span>購入理由スコア</span>
        <span>{r.score} / 100</span>
      </div>
    </section>
  );
}
