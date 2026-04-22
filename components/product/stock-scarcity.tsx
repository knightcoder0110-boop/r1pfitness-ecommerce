import { cn } from "@/lib/utils/cn";
import type { Product, ProductVariation } from "@/lib/woo/types";

/**
 * StockScarcity — a small pill that signals urgency without being pushy.
 *
 * Visible only when the effective item is tracked AND has ≤10 units left.
 * Tone:
 *   - ≤5 units   → coral dot (urgent)
 *   - 6–10 units → gold dot (low)
 * Otherwise: returns null so the PDP doesn't render a stale row.
 *
 * Accepts either a product (for simple products) or a resolved variation
 * (for variable products after the picker has matched a variant).
 */
export interface StockScarcityProps {
  product: Product;
  variation?: ProductVariation | undefined;
  className?: string;
}

export function StockScarcity({ product, variation, className }: StockScarcityProps) {
  // Prefer variation stock; fall back to product stock.
  const qty = variation?.stockQuantity ?? product.stockQuantity;
  const status = variation?.stockStatus ?? product.stockStatus;

  if (status === "out_of_stock") return null;
  if (qty === undefined || qty === null) return null;
  if (qty <= 0 || qty > 10) return null;

  const urgent = qty <= 5;
  const text = urgent
    ? `Only ${qty} left — order soon`
    : `${qty} in stock`;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "inline-flex items-center gap-2.5 px-3 py-1.5 rounded-sm",
        "border",
        urgent
          ? "border-coral/40 bg-coral/[0.06] text-coral"
          : "border-gold/40 bg-gold/[0.06] text-gold",
        "font-mono text-[10px] uppercase tracking-[0.25em]",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "inline-block size-1.5 rounded-full",
          urgent ? "bg-coral animate-pulse" : "bg-gold",
        )}
      />
      {text}
    </div>
  );
}
