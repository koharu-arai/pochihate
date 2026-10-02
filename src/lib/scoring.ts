import type { FilledAnswers, PartKey, PerUseMode, Result } from "./types";

export type Question =
  | { key: "reason"; type: "text"; title: string; hint?: string; placeholder: string }
  | { key: "want" | "vanity" | "need" | "irreplace"; type: "scale"; title: string; hint?: string; lo: string; hi: string }
  | {
      key: "freq" | "perUse" | "months";
      type: "number";
      title: string;
      hint?: string;
      unit: string;
      step: number;
      chips: [string, number][];
    };

export const QUESTIONS: Question[] = [
  { key: "reason", type: "text", title: "なぜ欲しい？", hint: "一言でOK。結果画面に残ります。", placeholder: "例: 今のPCが重くて動画編集がつらい" },
  { key: "want", type: "scale", title: "どれくらい欲しい？", lo: "ちょっと気になる", hi: "今すぐ欲しい" },
  {
    key: "vanity",
    type: "scale",
    title: "その「欲しい」は、新しいから・持っていると気分がいいから？",
    hint: "自己満の度合い。高いほど少しだけ減点されます(最大−8点)。",
    lo: "関係ない",
    hi: "ほぼそれが理由",
  },
  { key: "need", type: "scale", title: "本当に必要？", lo: "なくても困らない", hi: "ないと困る" },
  { key: "irreplace", type: "scale", title: "今持っているもので代用できる？", lo: "完全に代用できる", hi: "まったく代用できない" },
  {
    key: "freq",
    type: "number",
    title: "どれくらいの頻度で使う？",
    unit: "回 / 週",
    step: 0.25,
    chips: [["毎日", 7], ["週3", 3], ["週1", 1], ["月2", 0.5], ["月1", 0.25]],
  },
  {
    key: "perUse",
    type: "number",
    title: "1回使うと、いくら分助かる？",
    hint: "時間の節約・代わりに払うはずのお金など。ざっくりでOK。",
    unit: "円 / 回",
    step: 50,
    chips: [["100円", 100], ["300円", 300], ["500円", 500], ["1,000円", 1000], ["3,000円", 3000]],
  },
  {
    key: "months",
    type: "number",
    title: "何ヶ月くらい使う予定？",
    unit: "ヶ月",
    step: 1,
    chips: [["6ヶ月", 6], ["1年", 12], ["2年", 24], ["3年", 36], ["5年", 60]],
  },
];

/** 各項目の重み（貯金が未入力のときは savings を除いて平均） */
export const WEIGHTS: Record<PartKey, number> = { want: 10, need: 20, irreplace: 15, freq: 15, payback: 20, savings: 20 };
export const LABELS: Record<PartKey, string> = {
  want: "欲しい度",
  need: "必要度",
  irreplace: "代用できなさ",
  freq: "使用頻度",
  payback: "元の取りやすさ",
  savings: "貯金への負担の軽さ",
};
/** 自己満度10のときの減点 */
export const VANITY_MAX = 8;
/** 価格が貯金を超えたときの上限点 */
export const OVER_SAVINGS_CAP = 59;
export const WEEKS_PER_MONTH = 4.33;
export const RECHECK_DAYS = 30;
/** この金額以上を「高額」として1回あたりのコストを出す */
export const EXPENSIVE_PRICE = 30000;

export function shouldShowPerUse(mode: PerUseMode | undefined, price: number): boolean {
  const m = mode ?? "expensive";
  return m === "always" || (m === "expensive" && price >= EXPENSIVE_PRICE);
}
export const DAY_MS = 86_400_000;

function interp(x: number, pts: [number, number][]): number {
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    if (x <= pts[i][0]) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }
  }
  return pts[pts.length - 1][1];
}

export function calc(price: number, a: FilledAnswers): Result {
  const usesPerMonth = a.freq * WEEKS_PER_MONTH;
  const monthlyValue = usesPerMonth * a.perUse;
  const payback = monthlyValue > 0 ? price / monthlyValue : null;
  const totalUses = usesPerMonth * a.months;
  const perUseCost = totalUses > 0 ? price / totalUses : null;

  let paybackScore =
    payback === null ? 0 : interp(payback, [[1, 100], [3, 90], [6, 75], [12, 55], [24, 35], [48, 15], [96, 5]]);
  if (payback === null || payback > a.months) paybackScore = Math.min(paybackScore, 25);

  const savingsRatio = a.savings && a.savings > 0 ? price / a.savings : null;
  const parts: Result["parts"] = {
    want: a.want * 10,
    need: a.need * 10,
    irreplace: a.irreplace * 10,
    freq: interp(a.freq, [[0, 0], [0.25, 20], [1, 50], [3, 75], [5, 90], [7, 100]]),
    payback: paybackScore,
  };
  if (savingsRatio !== null) {
    parts.savings = interp(savingsRatio, [[0.05, 100], [0.1, 85], [0.2, 65], [0.3, 45], [0.5, 20], [1, 0]]);
  }

  let sum = 0;
  let w = 0;
  for (const k of Object.keys(parts) as PartKey[]) {
    sum += (parts[k] ?? 0) * WEIGHTS[k];
    w += WEIGHTS[k];
  }
  const base = sum / w;
  const penalty = (a.vanity / 10) * VANITY_MAX;
  const overSavings = savingsRatio !== null && savingsRatio > 1;
  let score = Math.round(Math.max(0, base - penalty));
  if (overSavings) score = Math.min(score, OVER_SAVINGS_CAP);

  return { score, base, penalty, parts, payback, monthlyValue, perUseCost, savingsRatio, overSavings };
}

export type Band = { tone: "good" | "warn" | "bad"; label: string };
export function band(score: number): Band {
  if (score >= 80) return { tone: "good", label: "買ってよし" };
  if (score >= 60) return { tone: "warn", label: "もう少し考える" };
  return { tone: "bad", label: "見送り推奨" };
}

export function ruleComment(a: FilledAnswers, r: Result): string {
  const s: string[] = [];
  if (a.want >= 7 && a.need <= 5) s.push("「欲しい」が強いが、必要度はそこまで高くない。");
  else if (a.want >= 7 && a.need >= 7) s.push("欲しいし、ちゃんと必要でもある。");
  else if (a.want <= 4) s.push("そこまで欲しいわけではなさそう。");
  else s.push("気持ちも必要度もほどほど。");

  if (a.vanity >= 7) s.push("理由の多くは「新しいから」「気分がいいから」。");

  if (a.irreplace <= 4) s.push("今持っているものでも目的は達成可能。");
  else if (a.irreplace >= 8) s.push("代わりになるものがないのは強い理由。");

  if (r.overSavings) s.push("貯金を超える金額なので、今は買えない。");
  else if (r.savingsRatio !== null && r.savingsRatio >= 0.3) s.push(`貯金の${Math.round(r.savingsRatio * 100)}%が消える大きな出費。`);
  else if (r.savingsRatio !== null && r.savingsRatio <= 0.05) s.push("貯金に対しては小さな出費。");

  if (r.payback === null) s.push("使う頻度か価値がゼロだと元は取れない。");
  else if (r.payback > a.months) s.push(`元が取れるまで約${fmtMonths(r.payback)}かかり、使う期間内に回収できない。`);
  else if (r.payback <= a.months / 3) s.push(`約${fmtMonths(r.payback)}で元が取れる計算。`);

  return s.join("");
}

export function fmtMonths(m: number | null): string {
  if (m === null || !Number.isFinite(m)) return "—";
  if (m < 1) return "1ヶ月未満";
  if (m >= 24) return `${(m / 12).toFixed(1).replace(/\.0$/, "")}年`;
  return `${Math.round(m)}ヶ月`;
}

export function yen(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  return `¥${Math.round(n).toLocaleString("ja-JP")}`;
}

export function fmtDate(t: number): string {
  const d = new Date(t);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

/** 回答途中に出す計算メモ */
export function liveHint(key: string, a: Partial<FilledAnswers>, price: number): string {
  if (key === "freq" && a.freq != null) {
    return `→ 月に約${(a.freq * WEEKS_PER_MONTH).toFixed(1).replace(/\.0$/, "")}回`;
  }
  if (key === "perUse" && a.perUse != null && a.freq != null) {
    const mv = a.freq * WEEKS_PER_MONTH * a.perUse;
    return mv > 0 ? `→ 月に${yen(mv)}分。元が取れるまで約${fmtMonths(price / mv)}` : "→ これだと元は取れません";
  }
  if (key === "months" && a.months && a.freq != null && a.perUse != null) {
    const mv = a.freq * WEEKS_PER_MONTH * a.perUse;
    if (mv <= 0) return "";
    const pb = price / mv;
    return pb <= a.months ? `→ 元が取れるまで約${fmtMonths(pb)}。使う期間内に回収できます` : `→ 元が取れるまで約${fmtMonths(pb)}。使う期間内には回収できません`;
  }
  return "";
}
