import { cn } from "@/lib/utils/cn";
import { formatMoney } from "@/lib/utils/format";
import type { Money } from "@/lib/woo/types";

export interface PriceProps {
  price: Money;
  compareAtPrice?: Money;
  className?: string;
  /** Size preset. */
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASSES: Record<NonNullable<PriceProps["size"]>, { current: string; compare: string }> =
  {
    sm: { current: "text-sm", compare: "text-xs" },
    md: { current: "text-base", compare: "text-sm" },
    lg: { current: "text-2xl", compare: "text-base" },
  };

/**
 * Renders a price, plus a struck-through compare-at price if the product is
 * discounted. Monetary formatting is locale-aware via `formatMoney`.
 */
export function Price({ price, compareAtPrice, className, size = "md" }: PriceProps) {
  const classes = SIZE_CLASSES[size];
  const onSale = compareAtPrice && compareAtPrice.amount > price.amount;

  return (
    <span className={cn("inline-flex items-baseline gap-2 font-mono", className)}>
      <span className={cn(classes.current, onSale ? "text-coral" : "text-text")}>
        {formatMoney(price)}
      </span>
      {onSale ? (
        <span className={cn(classes.compare, "text-subtle line-through")}>
          {formatMoney(compareAtPrice)}
        </span>
      ) : null}
    </span>
  );
}
