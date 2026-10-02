import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-bold transition-[background-color,opacity,transform] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline: "border border-border bg-transparent text-foreground hover:bg-muted",
        ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
        link: "h-auto px-0 py-0 text-xs font-normal text-muted-foreground underline underline-offset-4 hover:text-foreground",
        destructive: "h-auto px-0 py-0 text-xs font-normal text-bad underline underline-offset-4",
      },
      size: {
        default: "h-12 px-5 text-[15px]",
        sm: "h-9 px-3 text-[13px] rounded-[10px]",
        lg: "h-13 px-6 text-base",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
