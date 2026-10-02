"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { EXPENSIVE_PRICE, yen } from "@/lib/scoring";
import type { PerUseMode } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Stat } from "@/components/ListView";


export function SettingsView() {
  const { settings, setSettings, items, toast } = useStore();
  const [value, setValue] = useState(settings.savings != null ? String(settings.savings) : "");
  const num = value === "" ? null : Number(value);
  const changed = (num ?? null) !== (settings.savings ?? null);
  const valid = num === null || (Number.isFinite(num) && num >= 0);

  function save() {
    if (!valid) return;
    setSettings({ savings: num && num > 0 ? num : null });
    toast(num && num > 0 ? "貯金を保存しました" : "貯金の設定を外しました");
  }

  const perUseMode: PerUseMode = settings.perUseMode ?? "expensive";
  const PER_USE_OPTIONS: [PerUseMode, string][] = [
    ["expensive", `${EXPENSIVE_PRICE / 10000}万円以上のとき`],
    ["always", "いつも"],
    ["never", "出さない"],
  ];

  const judged = items.reduce((s, i) => s + i.history.length, 0);
  const saved = items.filter((i) => i.status === "skipped").reduce((s, i) => s + i.price, 0);

  return (
    <>
      <h1 className="text-xl font-bold">マイページ</h1>

      <Card>
        <div className="flex flex-col gap-1">
          <label htmlFor="in-savings" className="font-bold">
            今の貯金
          </label>
          <p className="text-xs text-muted-foreground">ここに入れておくと、毎回の判定で自動で使われます。増えたり減ったりしたら書き換えてください。</p>
        </div>
        <div className="relative">
          <input
            id="in-savings"
            type="number"
            inputMode="numeric"
            min={0}
            step={1000}
            placeholder="例: 300000"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && changed && save()}
            className="w-full rounded-[10px] border border-border bg-background px-3 py-2.5 pr-9 font-mono text-lg tabular-nums text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25"
          />
          <span className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground">円</span>
        </div>
        <div className="flex items-center gap-3">
          <Button className="flex-1" disabled={!changed || !valid} onClick={save}>
            保存する
          </Button>
          {settings.savings != null && (
            <Button
              variant="link"
              onClick={() => {
                setValue("");
                setSettings({ savings: null });
                toast("貯金の設定を外しました");
              }}
            >
              設定しない
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {settings.savings != null ? `保存中: ${yen(settings.savings)}` : "未設定のときは「貯金への負担」を点数に入れずに計算します。"}
        </p>
      </Card>

      <Card className="gap-3">
        <div className="flex flex-col gap-1">
          <span className="font-bold">1回あたりのコストを内訳に出す</span>
          <p className="text-xs text-muted-foreground">価格 ÷ 使う回数の合計。高い買い物を細かく考えたいときの目安です(点数には影響しません)。</p>
        </div>
        <div className="grid grid-cols-3 gap-1 rounded-full border border-border bg-background p-[3px]" role="radiogroup" aria-label="1回あたりのコストの表示">
          {PER_USE_OPTIONS.map(([k, label]) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={perUseMode === k}
              onClick={() => {
                setSettings({ perUseMode: k });
                toast("表示の設定を保存しました");
              }}
              className={cn(
                "rounded-full px-2 py-1.5 text-xs transition-colors",
                perUseMode === k ? "bg-foreground text-card" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </Card>


      <div className="grid grid-cols-2 gap-2">
        <Stat label="これまでの判定" value={`${judged}回`} />
        <Stat label="見送って守った" value={yen(saved)} />
      </div>
      <p className="text-center text-[11px] text-muted-foreground">データはこの端末のブラウザに保存されます(ログインなし)</p>
    </>
  );
}
