export type Status = "waiting" | "bought" | "skipped";

export type Answers = {
  reason: string;
  want: number | null;
  vanity: number | null;
  need: number | null;
  irreplace: number | null;
  freq: number | null;
  perUse: number | null;
  months: number | null;
  /** 判定したときの貯金額（未入力なら null） */
  savings: number | null;
};

/** 全部答えたあとの回答 */
export type FilledAnswers = {
  reason: string;
  want: number;
  vanity: number;
  need: number;
  irreplace: number;
  freq: number;
  perUse: number;
  months: number;
  savings: number | null;
};

export type PartKey = "want" | "need" | "irreplace" | "freq" | "payback" | "savings";

export type Result = {
  score: number;
  /** 自己満の減点前の加重平均 */
  base: number;
  /** 自己満による減点 */
  penalty: number;
  parts: Partial<Record<PartKey, number>>;
  /** 元が取れるまでの月数。元が取れない場合は null */
  payback: number | null;
  monthlyValue: number;
  /** 1回あたりのコスト(価格 ÷ 使う回数の合計)。使わない場合は null */
  perUseCost?: number | null;
  /** 価格 ÷ 貯金。貯金未入力なら null */
  savingsRatio: number | null;
  overSavings: boolean;
};

export type HistoryEntry = {
  at: number;
  score: number;
  status: Status;
  answers: FilledAnswers;
  comment: string;
  result: Result;
};

export type Item = {
  id: string;
  name: string;
  price: number;
  createdAt: number;
  status: Status;
  score: number;
  recheckAt: number | null;
  decidedAt: number | null;
  history: HistoryEntry[];
};

export type PerUseMode = "expensive" | "always" | "never";

export type Settings = {
  savings: number | null;
  /** 1回あたりのコストを内訳に出すか（既定: 高額のときだけ） */
  perUseMode?: PerUseMode;
};
