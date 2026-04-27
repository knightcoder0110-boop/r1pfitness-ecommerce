import { Diamond, Flame, Package, Sparkles, Tag, type LucideIcon } from "lucide-react";
import {
  BADGE_DEFINITIONS,
  type BadgeIcon,
  type BadgeKind,
  type BadgeTone,
} from "@/lib/badges";
import { cn } from "@/lib/utils/cn";

/**
 * Maps the data-layer `BadgeIcon` string to the actual Lucide component.
 * Keeping this lookup in the UI layer means `lib/badges` stays free of
 * client-only deps and can be imported by server components or analytics.
 */
const ICON_MAP: Record<BadgeIcon, LucideIcon> = {
  diamond: Diamond,
  package: Package,
  flame: Flame,
  sparkles: Sparkles,
  tag: Tag,
};

/**
 * Resolves a Lucide icon component from a `BadgeIcon` key.
 *
 * Re-exported here so consumers can render the icon in custom layouts
 * (e.g. inline next to a title) without re-implementing the lookup.
 */
export function badgeIcon(icon: BadgeIcon): LucideIcon {
  return ICON_MAP[icon];
}

/**
 * Tailwind class fragments per tone. We use subtle tinted backgrounds with
 * a stronger coloured left-accent — this matches the brand's "stamp / mark"
 * visual language without screaming at the user.
 */
const TONE_STYLES: Record<
  BadgeTone,
  { bar: string; pill: string; accent: string; icon: string; label: string }
> = {
  gold: {
    bar: "bg-gradient-to-r from-gold/15 via-gold/5 to-transparent",
    pill: "bg-gold/12 border-gold/40",
    accent: "bg-gold",
    icon: "text-gold",
    label: "text-gold",
  },
  coral: {
    bar: "bg-gradient-to-r from-coral/15 via-coral/5 to-transparent",
    pill: "bg-coral/12 border-coral/40",
    accent: "bg-coral",
    icon: "text-coral",
    label: "text-coral",
  },
  ocean: {
    bar: "bg-gradient-to-r from-ocean/25 via-ocean/8 to-transparent",
    pill: "bg-ocean/20 border-ocean/50",
    accent: "bg-ocean",
    icon: "text-text",
    label: "text-text",
  },
  sand: {
    bar: "bg-gradient-to-r from-text/8 via-text/2 to-transparent",
    pill: "bg-surface-2 border-border-strong",
    accent: "bg-text/60",
    icon: "text-text",
    label: "text-text",
  },
};

export function getToneStyles(tone: BadgeTone) {
  return TONE_STYLES[tone];
}

// ──────────────────────────────────────────────────────────────────────
//  <ProductBadge /> — small inline pill
// ──────────────────────────────────────────────────────────────────────

export interface ProductBadgeProps {
  kind: BadgeKind;
  /**
   * "sm" pill is intended for product cards (PLP); "md" is for the inline
   * row above a product title on the PDP info column.
   */
  size?: "sm" | "md";
  className?: string;
}

/**
 * Compact pill badge — used on product cards and inside layouts where the
 * full conversion bar is too heavy. Server-rendered, no client deps.
 */
export function ProductBadge({ kind, size = "sm", className }: ProductBadgeProps) {
  const def = BADGE_DEFINITIONS[kind];
  const tone = TONE_STYLES[def.tone];
  const Icon = ICON_MAP[def.icon];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border font-mono uppercase",
        "tracking-[0.18em]",
        tone.pill,
        tone.label,
        size === "sm"
          ? "px-2 py-0.5 text-[10px]"
          : "px-2.5 py-1 text-[11px]",
        className,
      )}
      data-badge={def.kind}
    >
      <Icon
        aria-hidden
        className={cn(
          tone.icon,
          size === "sm" ? "size-3" : "size-3.5",
          "shrink-0",
        )}
        strokeWidth={2}
      />
      <span className="leading-none">{def.label}</span>
    </span>
  );
}
