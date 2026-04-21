import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em]",
  {
    variants: {
      tone: {
        gold: "border-gold/60 bg-gold/10 text-gold",
        coral: "border-coral/60 bg-coral/10 text-coral",
        neutral: "border-muted bg-surface-1 text-muted",
        danger: "border-red-500/50 bg-red-500/10 text-red-300",
        ocean: "border-ocean/60 bg-ocean/15 text-text",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
