import { cn } from "@/lib/utils/cn";
import { formatMoney } from "@/lib/utils/format";
import type { Money } from "@/lib/woo/types";

export interface PriceDisplayProps {
  price: Money;
  compareAtPrice?: Money | undefined;
  className?: string;
}

/**
 * Large, conversion-tuned price block for the PDP info column.
 *
 *   ┌─────────────────────────────────────────────────────┐
 *   │  $45.00   $̶6̶5̶.̶0̶0̶   [ −31% ]                       │
 *   │  ↑display   ↑muted   ↑coral pill                    │
 *   └─────────────────────────────────────────────────────┘
 *
 * Why a separate component instead of bumping `<Price size="lg" />`:
 *   • The PDP price needs the savings pill — this is a discrete,
 *     conversion-relevant signal that doesn't belong on cards.
 *   • Type matters here: prices use the display font for visual weight,
 *     not mono. This keeps PDPs feeling editorial.
 *   • Sale state is communicated FOUR ways for redundancy: coral hue,
 *     strikethrough on compare price, percentage pill, and explicit
 *     `aria-label`. Trust signals stack.
 */
export function PriceDisplay({ price, compareAtPrice, className }: PriceDisplayProps) {
  const onSale =
    compareAtPrice !== undefined && compareAtPrice.amount > price.amount;

  const savingsAmount = onSale
    ? { amount: compareAtPrice.amount - price.amount, currency: price.currency }
    : null;

  const savingsPercent = onSale
    ? Math.round(((compareAtPrice.amount - price.amount) / compareAtPrice.amount) * 100)
    : null;

  const ariaLabel = onSale
    ? `On sale: ${formatMoney(price)}, was ${formatMoney(compareAtPrice)} — save ${savingsPercent}%`
    : formatMoney(price);

  return (
    <div
      aria-label={ariaLabel}
      className={cn("flex flex-wrap items-baseline gap-x-3 gap-y-1", className)}
    >
      <span
        className={cn(
          "font-display tracking-[0.04em] leading-none",
          "text-3xl sm:text-4xl",
          onSale ? "text-coral" : "text-text",
        )}
      >
        {formatMoney(price)}
      </span>

      {onSale ? (
        <>
          <span
            aria-hidden
            className="font-mono text-base text-subtle line-through tabular-nums"
          >
            {formatMoney(compareAtPrice)}
          </span>
          <span
            aria-hidden
            className={cn(
              "inline-flex items-center rounded-sm border border-coral/50 bg-coral/12 px-2 py-0.5",
              "font-mono text-[11px] uppercase tracking-[0.2em] text-coral tabular-nums",
            )}
          >
            −{savingsPercent}%
          </span>
        </>
      ) : null}

      {onSale && savingsAmount ? (
        <span className="basis-full font-serif italic text-sm text-muted">
          You save {formatMoney(savingsAmount)}
        </span>
      ) : null}
    </div>
  );
}
