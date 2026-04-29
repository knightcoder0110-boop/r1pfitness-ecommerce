import {
  BADGE_DEFINITIONS,
  getPrimaryBadge,
  type BadgeResolvable,
  type BadgeTone,
} from "@/lib/badges";
import { cn } from "@/lib/utils/cn";
import { badgeIcon } from "./product-badge";

/** Solid fill per tone — matches the metallic add-to-cart button language. */
const SOLID_TONE: Record<BadgeTone, string> = {
  gold: "bg-[linear-gradient(170deg,#E6C56A_0%,#D4AF55_28%,#C9A84C_55%,#A88934_100%)] text-bg",
  coral: "bg-coral text-white",
  ocean: "bg-ocean text-white",
  sand: "bg-surface-3 text-text border border-border-strong",
};

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
  const Icon = badgeIcon(def.icon);

  return (
    <aside
      role="note"
      aria-label={def.label}
      data-badge-bar={kind}
      className={cn(
        "inline-flex items-center gap-1.5 self-start",
        "rounded-sm px-2.5 py-1",
        SOLID_TONE[def.tone],
        className,
      )}
    >
      <Icon
        aria-hidden
        strokeWidth={2.5}
        className="size-3 shrink-0"
      />
      <span
        className="font-mono text-[10px] uppercase tracking-[0.22em] font-bold leading-none"
      >
        {def.label}
      </span>
    </aside>
  );
}
