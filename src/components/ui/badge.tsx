import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-xs font-bold whitespace-nowrap", {
  variants: {
    tone: {
      good: "bg-good-soft text-good",
      warn: "bg-warn-soft text-warn",
      bad: "bg-bad-soft text-bad",
      tag: "bg-tag text-tag-foreground font-mono font-normal px-1.5 text-[11px] leading-[18px]",
    },
  },
  defaultVariants: { tone: "warn" },
});

function Badge({ className, tone, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export { Badge, badgeVariants };
