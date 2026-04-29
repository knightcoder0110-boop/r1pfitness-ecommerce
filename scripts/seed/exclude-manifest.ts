/**
 * scripts/seed/exclude-manifest.ts
 *
 * Explicit per-handle exclusions layered on top of `config.SKIP_GOOGLE_CATEGORY_PREFIXES`.
 *
 * These are products whose Product Category is empty or ambiguous but that we
 * know are NOT to be sold on the headless storefront — services, memberships,
 * POS-only items, accessories we're deprecating, etc.
 *
 * Add/remove entries here (not in config.ts) so the manifest is easy to review.
 *
 * Pass `--include-manifest` to the CLI to disable this list (and attempt to
 * seed the excluded handles, for debugging).
 */

export interface ExcludeEntry {
  handle: string;                // exact Shopify handle
  reason: string;                // short human explanation
}

export const EXCLUDE_MANIFEST: ExcludeEntry[] = [
  // ── Services / memberships / POS-only ──────────────────────────────────────
  { handle: "r1pfitness-1-month-gym-pass",    reason: "Service: gym membership — POS only" },
  { handle: "r1pfitness-1-week-gym-pass",     reason: "Service: gym membership — POS only" },
  { handle: "studio-rental-hrs-2",            reason: "Service: studio rental" },
  { handle: "get-r1pped-30-day-challange",    reason: "Service: 30-day challenge program" },

  // ── Honolulu Marathon one-offs (no inventory, event-specific) ─────────────
  { handle: "honolulu-marathon-singlet",          reason: "Event-specific item, no inventory/images" },
  { handle: "honolulu-marathon-running-shorts",   reason: "Event-specific item, no inventory/images" },
  { handle: "honolulu-marathon-t-shirt",          reason: "Event-specific item, no inventory/images" },

  // ── Women's line (no images in CSV, not relaunching yet) ──────────────────
  { handle: "womens-defy-leggings",       reason: "Women's line — no images, deferred launch" },
  { handle: "womens-defy-bra",            reason: "Women's line — no images, deferred launch" },
  { handle: "womens-define-leggings",     reason: "Women's line — no images, deferred launch" },
  { handle: "womens-define-sports-bra",   reason: "Women's line — no images, deferred launch" },
  { handle: "womens-define-bandeau",      reason: "Women's line — no images, deferred launch" },
  { handle: "womens-define-twisted-crop", reason: "Women's line — no images, deferred launch" },
  { handle: "womens-crop-jacket",         reason: "Women's line — no images, deferred launch" },

  // ── Misc deprecated / low-quality ─────────────────────────────────────────
  { handle: "r-p-tote-bag-sale",          reason: "Duplicate of primary tote, no images" },
  { handle: "r1pfitness-pro-waist-trimmer", reason: "No images, deprecated accessory" },
  { handle: "lanyard",                    reason: "No images, POS-only accessory" },
];

export function buildExcludeIndex(): Map<string, string> {
  const idx = new Map<string, string>();
  for (const e of EXCLUDE_MANIFEST) idx.set(e.handle, e.reason);
  return idx;
}
