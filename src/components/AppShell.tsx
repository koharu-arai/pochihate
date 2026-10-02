"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useStore } from "@/lib/store";
import { BottomNav } from "@/components/BottomNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { toastMsg, loaded } = useStore();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[520px] flex-col gap-[18px] px-4 pt-[calc(20px+env(safe-area-inset-top))] pb-28">
      <header className="flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2.5">
          <span aria-hidden className="mini-tag relative h-[18px] w-[26px] bg-tag after:absolute after:top-[7px] after:left-[9px] after:size-1 after:rounded-full after:bg-background" />
          <span className="font-display text-[22px] tracking-[0.02em]">ポチハテ</span>
          <span className="text-[11px] tracking-wide text-muted-foreground">買うか迷ってる</span>
        </Link>
      </header>

      <main className="flex flex-col gap-3.5">{loaded ? children : <p className="py-10 text-center text-sm text-muted-foreground">読み込み中…</p>}</main>

      <BottomNav />

      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(96px+env(safe-area-inset-bottom))] z-40 flex justify-center px-4">
        <AnimatePresence>
          {toastMsg && (
            <motion.div
              key={toastMsg}
              role="status"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="rounded-[10px] bg-foreground px-4 py-2.5 text-[13px] text-background"
            >
              {toastMsg}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
