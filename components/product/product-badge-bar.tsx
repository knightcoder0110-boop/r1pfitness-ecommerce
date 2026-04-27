import {
  BADGE_DEFINITIONS,
  getDiscountPercent,
  getPrimaryBadge,
  type BadgeResolvable,
} from "@/lib/badges";
import { cn } from "@/lib/utils/cn";
import { badgeIcon, getToneStyles } from "./product-badge";

export interface ProductBadgeBarProps {
  product: BadgeResolvable;
  className?: string;
}

/**
 * Prominent conversion banner shown at the very top of a PDP — above even
 * the gallery — so users get the most important commercial signal in their
 * first 3 seconds on the page.
 *
 *   ┌────────────────────────────────────────────────────────────┐
 *   │ ▎🔥  BEST SELLER · Our most reordered piece                │
 *   └────────────────────────────────────────────────────────────┘
 *
 * Renders nothing when no badge applies. Server component (no client deps).
 *
 * Mobile: shows label only (compressed to 44px).
 * Desktop: shows label + tagline separated by a divider.
 *
 * Driven by `lib/badges` — the UI never decides which badge to show, it just
 * renders whatever the resolver returns. This keeps badge logic testable
 * and reusable across PDP, PLP, search, etc.
 */
export function ProductBadgeBar({ product, className }: ProductBadgeBarProps) {
  const kind = getPrimaryBadge(product);
  if (!kind) return null;

  const def = BADGE_DEFINITIONS[kind];
  const tone = getToneStyles(def.tone);
  const Icon = badgeIcon(def.icon);

  // For sale badges, replace the static tagline with the actual % off.
  const tagline =
    kind === "sale"
      ? `${getDiscountPercent(product) ?? 0}% off — for a limited window`
      : def.tagline;

  return (
    <aside
      role="note"
      aria-label={`${def.label}: ${tagline}`}
      data-badge-bar={kind}
      className={cn(
        "relative flex h-11 sm:h-12 items-center overflow-hidden rounded-sm",
        "border border-border",
        tone.bar,
        className,
      )}
    >
      {/* Left accent rail */}
      <span
        aria-hidden
        className={cn("absolute inset-y-0 left-0 w-1", tone.accent)}
      />

      <div className="flex w-full items-center gap-3 pl-4 pr-3 sm:pl-5 sm:pr-4">
        <Icon
          aria-hidden
          strokeWidth={2}
          className={cn("size-4 sm:size-4.5 shrink-0", tone.icon)}
        />

        <span
          className={cn(
            "font-mono uppercase tracking-[0.22em] leading-none",
            "text-[11px] sm:text-xs font-bold",
            tone.label,
          )}
        >
          {def.label}
        </span>

        {/* Divider + tagline — desktop only */}
        <span
          aria-hidden
          className="hidden sm:inline-block h-3 w-px bg-border-strong/60"
        />
        <span
          className={cn(
            "hidden sm:inline-block truncate font-serif italic",
            "text-sm text-muted",
          )}
        >
          {tagline}
        </span>
      </div>
    </aside>
  );
}
