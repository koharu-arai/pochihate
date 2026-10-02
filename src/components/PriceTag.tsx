"use client";

import { motion, animate, useMotionValue, useTransform } from "motion/react";
import { useEffect } from "react";

/** 結果画面の、吊り下がった値札に点数を出す */
export function PriceTag({ score }: { score: number }) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v));

  useEffect(() => {
    const c = animate(mv, score, { duration: 0.9, ease: [0.2, 0.8, 0.2, 1] });
    return () => c.stop();
  }, [mv, score]);

  return (
    <motion.div
      role="img"
      aria-label={`購入理由 ${score}点`}
      initial={{ rotate: -14, y: -16, opacity: 0 }}
      animate={{ rotate: -4, y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 180, damping: 11 }}
      style={{ transformOrigin: "20px 50%" }}
      className="price-tag relative w-[150px] bg-tag pt-[22px] pr-[18px] pb-[18px] pl-10 text-tag-foreground"
    >
      <small className="block text-[11px] tracking-[0.06em]">購入理由</small>
      <span className="font-display text-[52px] leading-none tabular-nums">
        <motion.span>{rounded}</motion.span>
        <em className="ml-0.5 text-lg not-italic">点</em>
      </span>
    </motion.div>
  );
}
