/**
 * Product Badge System — single source of truth.
 *
 * Drives the prominent "conversion badge bar" at the top of the PDP and the
 * smaller pill badges shown on product cards / PLPs.
 *
 * ────────────────────────────────────────────────────────────────────────
 *  How it works
 * ────────────────────────────────────────────────────────────────────────
 *
 * Five badge kinds, deliberately kept small so each retains meaning:
 *
 *   1. limited        — premium, rare, drop-style item
 *   2. back-in-stock  — recently restocked (recency + scarcity)
 *   3. bestseller     — top seller, social proof
 *   4. new-arrival    — recently launched (freshness)
 *   5. sale           — auto-derived when compareAtPrice > price
 *
 * Four of the five are driven by **WooCommerce product tags** that the admin
 * adds in the Woo dashboard. The tag slugs are listed in `BADGE_TAG_SLUGS`.
 *
 *   Woo tag        → BadgeKind
 *   "limited"      → "limited"        (or product.meta.isLimited === true)
 *   "back-in-stock"→ "back-in-stock"
 *   "bestseller"   → "bestseller"
 *   "new-arrival"  → "new-arrival"
 *
 * The fifth (`sale`) is auto-derived from price.
 *
 * Tag matching is case-insensitive and normalises whitespace/underscores to
 * hyphens, so admins can write "Best Seller", "best_seller", "BESTSELLER" —
 * all of these match.
 *
 * ────────────────────────────────────────────────────────────────────────
 *  Priority
 * ────────────────────────────────────────────────────────────────────────
 *
 * Only ONE badge shows in the PDP badge bar at a time. Priority is the array
 * order in `BADGE_PRIORITY` below. The first match wins.
 *
 * Product cards may show 1–2 small badge pills using `getProductBadges()` and
 * slicing the result.
 *
 * ────────────────────────────────────────────────────────────────────────
 *  Adding a new badge
 * ────────────────────────────────────────────────────────────────────────
 *
 * 1. Add the new kind to `BadgeKind`.
 * 2. Add a definition to `BADGE_DEFINITIONS` (label, tone, icon, tagline).
 * 3. Insert it at the right position in `BADGE_PRIORITY`.
 * 4. Either add a tag mapping in `BADGE_TAG_SLUGS`, or update `deriveBadges()`
 *    if it should be auto-derived from product fields.
 *
 * Keep total badge count ≤ 6. Badges are valuable because they're rare.
 */

import type { Product, ProductSummary } from "@/lib/woo/types";

// ── 1. Types ────────────────────────────────────────────────────────────

export type BadgeKind =
  | "vip-exclusive"
  | "collab"
  | "limited"
  | "pre-order"
  | "back-in-stock"
  | "few-left"
  | "bestseller"
  | "new-arrival"
  | "bundle"
  | "sale";

export type BadgeTone = "gold" | "coral" | "ocean" | "sand";

export interface BadgeDefinition {
  /** Stable identifier — used as React key + analytics tag. */
  kind: BadgeKind;
  /** Short label for the bar/pill. UPPERCASE in display. */
  label: string;
  /** One-line supporting copy used by `<ProductBadgeBar />` only. */
  tagline: string;
  /** Visual tone — drives colour. */
  tone: BadgeTone;
  /** Lucide icon name — looked up at render time. Avoids import cycles. */
  icon: BadgeIcon;
}

/**
 * We keep this as a discriminated string union (not a direct lucide import)
 * so the badges module stays a pure data module — UI components resolve the
 * icon themselves. This means SSR/server components can call `getProductBadges`
 * without dragging the lucide bundle in.
 */
export type BadgeIcon = "diamond" | "package" | "flame" | "sparkles" | "tag" | "zap" | "crown" | "users" | "clock" | "layers";

// ── 2. Definitions ──────────────────────────────────────────────────────

export const BADGE_DEFINITIONS: Record<BadgeKind, BadgeDefinition> = {
  "vip-exclusive": {
    kind: "vip-exclusive",
    label: "VIP Only",
    tagline: "Reserved for VIP members — exclusive access.",
    tone: "gold",
    icon: "crown",
  },
  collab: {
    kind: "collab",
    label: "Collab Drop",
    tagline: "A limited athlete collaboration.",
    tone: "ocean",
    icon: "users",
  },
  limited: {
    kind: "limited",
    label: "Limited Drop",
    tagline: "Once it's gone — it's gone.",
    tone: "gold",
    icon: "diamond",
  },
  "pre-order": {
    kind: "pre-order",
    label: "Pre-Order",
    tagline: "Secure yours now — ships when it drops.",
    tone: "sand",
    icon: "clock",
  },
  "back-in-stock": {
    kind: "back-in-stock",
    label: "Back in Stock",
    tagline: "Restocked by popular demand.",
    tone: "ocean",
    icon: "package",
  },
  bestseller: {
    kind: "bestseller",
    label: "Best Seller",
    tagline: "Our most reordered piece.",
    tone: "gold",
    icon: "flame",
  },
  "new-arrival": {
    kind: "new-arrival",
    label: "New Arrival",
    tagline: "Fresh off the press — just landed.",
    tone: "coral",
    icon: "sparkles",
  },
  "few-left": {
    kind: "few-left",
    label: "Few Left",
    tagline: "Low on stock — grab yours before it's gone.",
    tone: "coral",
    icon: "zap",
  },
  bundle: {
    kind: "bundle",
    label: "Bundle Deal",
    tagline: "Better together — save when you bundle.",
    tone: "ocean",
    icon: "layers",
  },
  sale: {
    kind: "sale",
    label: "On Sale",
    tagline: "Marked down for a limited window.",
    tone: "coral",
    icon: "tag",
  },
};

/**
 * Priority order for the PDP badge bar. The first match wins.
 *
 * Rationale: rarer / higher-perceived-value badges go first.
 */
export const BADGE_PRIORITY: BadgeKind[] = [
  "vip-exclusive",  // rarest — access-gated drop
  "collab",         // high-perceived-value athlete collab
  "limited",        // scarcity
  "pre-order",      // upcoming, needs attention
  "back-in-stock",  // urgency — won't last
  "few-left",       // stock scarcity
  "bestseller",     // social proof
  "new-arrival",    // freshness
  "bundle",         // deal
  "sale",           // discount (last — least rare)
];

/**
 * Map of normalised Woo tag slug → BadgeKind. Admin-controlled tags.
 * Note: `sale` is auto-derived, not tag-driven.
 */
const BADGE_TAG_SLUGS: Record<string, BadgeKind> = {
  // VIP / exclusive
  vip: "vip-exclusive",
  "vip-exclusive": "vip-exclusive",
  "vip-only": "vip-exclusive",
  "members-only": "vip-exclusive",
  members: "vip-exclusive",
  exclusive: "vip-exclusive",
  // Collab
  collab: "collab",
  collaboration: "collab",
  "collab-drop": "collab",
  // Limited
  limited: "limited",
  "limited-drop": "limited",
  // Pre-order
  "pre-order": "pre-order",
  preorder: "pre-order",
  "coming-soon": "pre-order",
  // Back in stock
  "back-in-stock": "back-in-stock",
  restocked: "back-in-stock",
  // Bestseller
  bestseller: "bestseller",
  "best-seller": "bestseller",
  // New arrival
  "new-arrival": "new-arrival",
  "new-arrivals": "new-arrival",
  new: "new-arrival",
  // Bundle
  bundle: "bundle",
  "bundle-deal": "bundle",
  "bundle-save": "bundle",
};

// ── 3. Resolution ───────────────────────────────────────────────────────

/** Normalise a tag string to a slug-style key for matching. */
function normaliseTag(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

/**
 * Subset of Product fields the badge resolver actually uses. Allows callers
 * to pass either a full Product or a slimmer object (e.g. ProductSummary +
 * tags) without forcing them through the type system.
 */
export interface BadgeResolvable {
  tags?: string[];
  price?: { amount: number };
  compareAtPrice?: { amount: number } | undefined;
  meta?: { isLimited?: boolean };
  stockStatus?: string;
}

/**
 * Resolve all applicable badges for a product, sorted by priority.
 *
 * Pure function — safe to call in server components, RSC streaming, or
 * during static generation.
 */
export function getProductBadges(product: BadgeResolvable): BadgeKind[] {
  const set = new Set<BadgeKind>();

  // Auto-derived: sale.
  if (
    product.compareAtPrice &&
    product.price &&
    product.compareAtPrice.amount > product.price.amount
  ) {
    set.add("sale");
  }

  // Auto-derived: limited (legacy meta path, still respected).
  if (product.meta?.isLimited) {
    set.add("limited");
  }

  // Auto-derived: few-left from stock status.
  if (product.stockStatus === "low_stock") {
    set.add("few-left");
  }

  // Tag-driven: match against BADGE_TAG_SLUGS.
  for (const tag of product.tags ?? []) {
    const slug = normaliseTag(tag);
    const kind = BADGE_TAG_SLUGS[slug];
    if (kind) set.add(kind);
  }

  return BADGE_PRIORITY.filter((k) => set.has(k));
}

/**
 * Returns the single highest-priority badge for a product, or null when none
 * apply. Used by the PDP badge bar.
 */
export function getPrimaryBadge(product: BadgeResolvable): BadgeKind | null {
  return getProductBadges(product)[0] ?? null;
}

/**
 * Helper: compute discount percent for the sale badge tagline. Returns null
 * when product is not on sale. Rounded to nearest whole percent.
 */
export function getDiscountPercent(product: BadgeResolvable): number | null {
  if (!product.compareAtPrice || !product.price) return null;
  const compare = product.compareAtPrice.amount;
  const current = product.price.amount;
  if (compare <= current) return null;
  return Math.round(((compare - current) / compare) * 100);
}

// ── 4. Convenience for ProductSummary (PLP cards) ──────────────────────

/**
 * ProductSummary on PLPs doesn't carry `tags` today (see lib/woo/types.ts).
 * This helper keeps the call-site nice when we eventually add it.
 */
export function getSummaryBadges(summary: ProductSummary): BadgeKind[] {
  return getProductBadges({
    price: summary.price,
    compareAtPrice: summary.compareAtPrice,
    meta: { isLimited: summary.isLimited },
    // tags not yet on summary — see roadmap to thread them through.
  });
}

// ── 5. Re-exports for type convenience ─────────────────────────────────

export type { Product, ProductSummary };
