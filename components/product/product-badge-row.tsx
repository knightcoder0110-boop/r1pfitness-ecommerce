import {
  BADGE_DEFINITIONS,
  getProductBadges,
  type BadgeResolvable,
} from "@/lib/badges";
import { cn } from "@/lib/utils/cn";
import { badgeIcon, getToneStyles } from "./product-badge";

export interface ProductBadgeRowProps {
  product: BadgeResolvable;
  /** Maximum badges to show — extras after this are dropped. Default 2. */
  max?: number;
  className?: string;
}

/**
 * Compact horizontal row of small badge pills, designed to sit *just above*
 * the product title in the PDP info column. Replaces the older full-width
 * banner for in-column placement.
 *
 *   ▸ LIMITED   ▸ BEST SELLER
 *
 * Up to two badges (priority-ordered) — beyond that the visual signal
 * dilutes. Renders nothing when no badges resolve.
 *
 * Server-safe: same data resolver as `<ProductBadgeBar />`, just a slimmer
 * presentation.
 */
export function ProductBadgeRow({
  product,
  max = 2,
  className,
}: ProductBadgeRowProps) {
  const kinds = getProductBadges(product).slice(0, max);
  if (kinds.length === 0) return null;

  return (
    <ul
      role="list"
      aria-label="Product badges"
      className={cn("flex flex-wrap gap-2", className)}
    >
      {kinds.map((kind) => {
        const def = BADGE_DEFINITIONS[kind];
        const tone = getToneStyles(def.tone);
        const Icon = badgeIcon(def.icon);
        return (
          <li key={kind}>
            <span
              data-badge={kind}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-sm border px-2 py-1",
                "font-mono text-[10px] uppercase tracking-[0.22em] font-bold leading-none",
                tone.pill,
                tone.label,
              )}
            >
              <Icon
                aria-hidden
                strokeWidth={2.25}
                className={cn("size-3 shrink-0", tone.icon)}
              />
              {def.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
