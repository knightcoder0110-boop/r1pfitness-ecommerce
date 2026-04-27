"use client";

import { Check, Truck } from "lucide-react";
import { useCartSubtotal } from "@/lib/cart";
import { FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/constants/shipping";
import { formatMoney } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export interface FreeShippingProgressProps {
  /** Optional — extra cents to add to the cart subtotal preview (e.g. the
   *  unit price of the item being viewed, so the bar reflects "if I add this"). */
  pendingCents?: number;
  className?: string;
}

/**
 * Slim progress bar showing how close the user is to free shipping.
 *
 *   Idle:     [▓▓▓░░░░░░░] $42 away from free shipping
 *   Unlocked: [▓▓▓▓▓▓▓▓▓▓] ✓ Free shipping unlocked
 *
 * Reads cart subtotal from the live cart store. Optionally accepts a
 * `pendingCents` prop so the bar can preview "what if I add this item",
 * giving users a goal-gradient nudge to add another piece.
 *
 * Why this matters: Baymard finds a free-shipping progress meter is one
 * of the highest-AOV-impact PDP elements. The threshold is configured
 * once in `lib/constants/shipping`, never hard-coded in copy.
 */
export function FreeShippingProgress({
  pendingCents = 0,
  className,
}: FreeShippingProgressProps) {
  const subtotal = useCartSubtotal();
  const previewCents = subtotal.amount + Math.max(0, pendingCents);
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD_CENTS - previewCents);
  const unlocked = remaining === 0;
  const pct = Math.min(
    100,
    Math.round((previewCents / FREE_SHIPPING_THRESHOLD_CENTS) * 100),
  );

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("flex flex-col gap-2", className)}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
          {unlocked ? (
            <Check aria-hidden strokeWidth={2.5} className="size-3.5 text-success" />
          ) : (
            <Truck aria-hidden strokeWidth={1.75} className="size-3.5 text-gold" />
          )}
          {unlocked
            ? "Free shipping unlocked"
            : `${formatMoney({ amount: remaining, currency: subtotal.currency })} from free shipping`}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint tabular-nums">
          {pct}%
        </span>
      </div>

      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progress toward free shipping"
        className="relative h-1 w-full overflow-hidden rounded-full bg-surface-2"
      >
        <span
          aria-hidden
          className={cn(
            "absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ease-out",
            unlocked ? "bg-success" : "bg-gold",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
