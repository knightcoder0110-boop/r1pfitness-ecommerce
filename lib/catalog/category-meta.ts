/**
 * Static presentation metadata for known category slugs.
 *
 * WooCommerce categories come back with { id, name, slug, image?, count?,
 * description?, parentId? } — nothing visual beyond the cover image. This
 * registry enriches known slugs with a brand-tuned gradient and a short
 * tagline, used by the unified `<CategoryCard>` when:
 *   1. The category has no cover image, OR
 *   2. The designer wants the hand-picked brand gradient anyway.
 *
 * Unknown slugs fall back to `FALLBACK_GRADIENTS` cycled by index.
 *
 * Pure data — no runtime dependencies. Safe to import from client bundles.
 */

export interface CategoryMeta {
  /** CSS gradient used when there is no cover image (or as a base under it). */
  gradient: string;
  /** Short editorial tagline shown as a pill on the card. Optional. */
  tagline?: string;
}

const tees: CategoryMeta = {
  gradient: "linear-gradient(150deg,#180800 0%,#3c1e00 45%,#5a2c08 100%)",
  tagline: "Vintage wash. Limited runs.",
};

const hoodies: CategoryMeta = {
  gradient: "linear-gradient(150deg,#04060c 0%,#091324 50%,#0e2040 100%)",
  tagline: "Heavyweight comfort.",
};

const bottoms: CategoryMeta = {
  gradient: "linear-gradient(150deg,#050b03 0%,#0d1c06 50%,#162c0c 100%)",
  tagline: "Train hard. Look clean.",
};

const caps: CategoryMeta = {
  gradient: "linear-gradient(150deg,#100507 0%,#260d0e 50%,#381416 100%)",
  tagline: "Represent everywhere.",
};

const accessories: CategoryMeta = {
  gradient: "linear-gradient(150deg,#05050c 0%,#0b0e24 50%,#10163e 100%)",
  tagline: "Finish the fit.",
};

const activewear: CategoryMeta = {
  gradient: "linear-gradient(150deg,#090907 0%,#141208 50%,#201b0b 100%)",
  tagline: "Built for performance.",
};

const faith: CategoryMeta = {
  gradient: "linear-gradient(160deg,#04020c 0%,#0b0519 45%,#130828 100%)",
  tagline: "Faith over fear.",
};

const kingOfKings: CategoryMeta = {
  gradient: "linear-gradient(160deg,#0d0800 0%,#261500 45%,#3d2200 100%)",
  tagline: "Crown the grind.",
};

const dragonBallZ: CategoryMeta = {
  gradient: "linear-gradient(160deg,#0d0300 0%,#2a0800 45%,#420e00 100%)",
  tagline: "Over 9000.",
};

const goldEra: CategoryMeta = {
  gradient: "linear-gradient(160deg,#0d0900 0%,#2a1d00 45%,#3f2b00 100%)",
  tagline: "Iron, oil, glory.",
};

const onePiece: CategoryMeta = {
  gradient: "linear-gradient(160deg,#00060d 0%,#00162a 45%,#002240 100%)",
  tagline: "Set sail.",
};

const darkRomance: CategoryMeta = {
  gradient: "linear-gradient(160deg,#0d0003 0%,#1e0309 45%,#2a050e 100%)",
  tagline: "Love was never gentle.",
};

/**
 * Known category slugs → presentation meta. Keys are lowercase slugs.
 * Safe to extend; unknown slugs use `FALLBACK_GRADIENTS`.
 */
export const CATEGORY_META: Record<string, CategoryMeta> = {
  tees,
  "t-shirts": tees,
  hoodies,
  bottoms,
  shorts: bottoms,
  pants: bottoms,
  caps,
  hats: caps,
  accessories,
  activewear,
  faith,
  "king-of-kings": kingOfKings,
  "dragon-ball-z": dragonBallZ,
  "gold-era": goldEra,
  "one-piece": onePiece,
  "dark-romance": darkRomance,
};

/**
 * Neutral cycling gradients for categories we haven't curated yet. Picked
 * by index (modulo length) so a row of unknown categories never shows two
 * identical tiles side-by-side.
 */
export const FALLBACK_GRADIENTS: string[] = [
  "linear-gradient(150deg,#180800 0%,#3c1e00 45%,#5a2c08 100%)",
  "linear-gradient(150deg,#04060c 0%,#091324 50%,#0e2040 100%)",
  "linear-gradient(150deg,#050b03 0%,#0d1c06 50%,#162c0c 100%)",
  "linear-gradient(150deg,#100507 0%,#260d0e 50%,#381416 100%)",
  "linear-gradient(150deg,#05050c 0%,#0b0e24 50%,#10163e 100%)",
  "linear-gradient(150deg,#090907 0%,#141208 50%,#201b0b 100%)",
];

/**
 * Look up brand meta for a slug, or return `undefined` if not registered.
 */
export function getCategoryMeta(slug: string): CategoryMeta | undefined {
  return CATEGORY_META[slug.toLowerCase()];
}

/**
 * Pick a deterministic gradient for a card. Prefers curated meta; falls
 * back to a cycling palette by index.
 */
export function resolveCategoryGradient(slug: string, index: number): string {
  const meta = getCategoryMeta(slug);
  if (meta) return meta.gradient;
  return FALLBACK_GRADIENTS[index % FALLBACK_GRADIENTS.length]!;
}
