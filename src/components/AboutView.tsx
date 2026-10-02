import { Card } from "@/components/ui/card";
import { EXPENSIVE_PRICE, LABELS, OVER_SAVINGS_CAP, RECHECK_DAYS, VANITY_MAX, WEIGHTS } from "@/lib/scoring";
import type { PartKey } from "@/lib/types";

const HOW: Record<PartKey, string> = {
  want: "0〜10 × 10",
  need: "0〜10 × 10",
  irreplace: "0〜10 × 10",
  freq: "月1=20 / 週1=50 / 週3=75 / 毎日=100",
  payback: "1ヶ月=100 / 半年=75 / 1年=55 / 2年=35",
  savings: "5%以下=100 / 20%=65 / 50%=20 / 100%=0",
};

const BANDS: [string, string, string][] = [
  ["80点以上", "買ってよし", "bg-good-soft text-good"],
  ["60〜79点", "もう少し考える", "bg-warn-soft text-warn"],
  ["59点以下", "見送り推奨", "bg-bad-soft text-bad"],
];

export function AboutView() {
  const keys = Object.keys(WEIGHTS) as PartKey[];
  return (
    <>
      <h1 className="text-xl font-bold">しくみ</h1>

      <Card className="gap-2.5">
        <span className="text-xs tracking-[0.08em] text-muted-foreground">流れ</span>
        <ol className="flex list-decimal flex-col gap-1 pl-5 text-sm">
          <li>欲しいものと価格を入れて、8つの質問に数字で答える</li>
          <li>6つの項目を100点に直して、重みをつけて平均する</li>
          <li>「新しいから」「気分がいいから」が大きいほど少し減点</li>
          <li>決めきれなければ{RECHECK_DAYS}日後にもう一度判定。点数の変化で気持ちが冷めたかわかる</li>
        </ol>
      </Card>

      <Card className="gap-2.5">
        <span className="text-xs tracking-[0.08em] text-muted-foreground">項目と重み</span>
        <div className="overflow-x-auto">
          <table className="w-full font-mono text-[13px] tabular-nums">
            <tbody>
              {keys.map((k) => (
                <tr key={k} className="border-b border-dashed border-border last:border-0">
                  <td className="py-1.5 pr-2 font-sans whitespace-nowrap">{LABELS[k]}</td>
                  <td className="py-1.5 pr-2 text-right whitespace-nowrap">×{WEIGHTS[k]}</td>
                  <td className="py-1.5 text-xs text-muted-foreground">{HOW[k]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="flex list-disc flex-col gap-1 pl-5 text-xs text-muted-foreground">
          <li>使う期間のうちに元が取れないときは、「元の取りやすさ」は最大25点</li>
          <li>貯金がマイページで未設定なら、「貯金への負担の軽さ」は外して平均</li>
          <li>価格が貯金を超えるときは、合計が最大{OVER_SAVINGS_CAP}点</li>
          <li>自己満度(0〜10)は最大 −{VANITY_MAX}点</li>
        </ul>
      </Card>

      <Card className="gap-2.5">
        <span className="text-xs tracking-[0.08em] text-muted-foreground">判定</span>
        <div className="flex flex-col gap-1.5">
          {BANDS.map(([range, label, cls]) => (
            <div key={label} className="flex items-center justify-between gap-3 text-sm">
              <span className="font-mono tabular-nums">{range}</span>
              <span className={`rounded-full px-3 py-0.5 text-xs font-bold ${cls}`}>{label}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="gap-2">
        <span className="text-xs tracking-[0.08em] text-muted-foreground">1回あたりのコスト</span>
        <p className="text-sm">
          価格 ÷ 使う回数の合計です。点数には入れず、{EXPENSIVE_PRICE.toLocaleString("ja-JP")}円以上の買い物のときだけ内訳に出します(マイページで変更できます)。
        </p>
      </Card>
    </>
  );
}
