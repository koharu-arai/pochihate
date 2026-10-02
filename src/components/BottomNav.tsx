"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { CalendarClock, History, Info, Plus, UserRound } from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const spring = { type: "spring", stiffness: 500, damping: 36 } as const;

const items = [
  { href: "/list", label: "30日", Icon: CalendarClock },
  { href: "/history", label: "履歴", Icon: History },
  { href: "/", label: "判定", Icon: Plus },
  { href: "/about", label: "しくみ", Icon: Info },
  { href: "/settings", label: "マイページ", Icon: UserRound },
] as const;

export function BottomNav() {
  const path = usePathname();
  const { items: saved } = useStore();
  const now = Date.now();
  const due = saved.filter((i) => i.status === "waiting" && i.recheckAt !== null && now >= i.recheckAt).length;

  return (
    <nav
      aria-label="メニュー"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/90 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] backdrop-blur"
    >
      <ul className="mx-auto grid max-w-[520px] grid-cols-5 items-end px-2 pt-1.5">
        {items.map(({ href, label, Icon }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);

          // まんなかの「判定」は大きな丸ボタン
          if (href === "/") {
            return (
              <li key={href} className="flex justify-center">
                <motion.div whileTap={{ scale: 0.9 }} whileHover={{ y: -2 }} transition={spring} className="-mt-6">
                  <Link
                    href="/"
                    aria-label="判定する"
                    aria-current={active ? "page" : undefined}
                    className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
                  >
                    <Plus className="size-7" strokeWidth={2.5} />
                  </Link>
                </motion.div>
              </li>
            );
          }

          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 py-1 text-[11px] transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                {active && (
                  <motion.span layoutId="nav-indicator" transition={spring} className="absolute -top-1.5 h-[3px] w-6 rounded-full bg-primary" />
                )}
                <motion.span
                  className="relative"
                  animate={{ y: active ? -1 : 0, scale: active ? 1.08 : 1 }}
                  whileTap={{ scale: 0.85 }}
                  transition={spring}
                >
                  <Icon className="size-6" strokeWidth={1.8} />
                  {href === "/list" && due > 0 && (
                    <span className="absolute -top-1 -right-2 min-w-[18px] rounded-full bg-tag px-1 text-center font-mono text-[10px] leading-[18px] text-tag-foreground">
                      {due}
                    </span>
                  )}
                </motion.span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
