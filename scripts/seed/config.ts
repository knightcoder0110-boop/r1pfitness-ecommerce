/**
 * scripts/seed/config.ts
 *
 * Static configuration for the seed pipeline.
 * All the "this is how we shape data going into Woo" knobs live here.
 */

// ── Runtime knobs ────────────────────────────────────────────────────────────
export const DEFAULT_STOCK = 25;
export const DEFAULT_STOCK_STATUS: "instock" | "onbackorder" = "instock";
export const MAX_CONCURRENCY = 2;
/** Default HTTP timeout (GETs and fast POSTs like term/category create). */
export const REQUEST_TIMEOUT_MS = 45_000;
/** Longer timeout for product create (Woo sideloads images synchronously). */
export const PRODUCT_CREATE_TIMEOUT_MS = 180_000;
export const MAX_RETRIES = 4;
export const RETRY_BACKOFF_BASE_MS = 800;

// ── Global WooCommerce attribute definitions ─────────────────────────────────
// These MUST be created as global taxonomies (pa_*) so the storefront's
// product-summary mapper + shop filters work. See `04-backend-woocommerce.md`
// and `/memories/repo/standardization-complete.md`.
export interface GlobalAttributeDef {
  slug: string;                 // passed as `slug` when creating; Woo auto-prefixes `pa_`
  taxonomy: string;             // full taxonomy slug, e.g. "pa_size"
  name: string;                 // human label
  type: "select" | "color";     // "color" triggers Woo swatches if plugin installed
  order_by: "menu_order" | "name" | "name_num" | "id";
  has_archives: boolean;
}

export const GLOBAL_ATTRIBUTES: GlobalAttributeDef[] = [
  { slug: "size",     taxonomy: "pa_size",     name: "Size",     type: "select", order_by: "menu_order", has_archives: false },
  { slug: "color",    taxonomy: "pa_color",    name: "Color",    type: "select", order_by: "menu_order", has_archives: true  },
  { slug: "fit",      taxonomy: "pa_fit",      name: "Fit",      type: "select", order_by: "menu_order", has_archives: false },
  { slug: "drop",     taxonomy: "pa_drop",     name: "Drop",     type: "select", order_by: "menu_order", has_archives: true  },
  { slug: "material", taxonomy: "pa_material", name: "Material", type: "select", order_by: "menu_order", has_archives: false },
  { slug: "collab",   taxonomy: "pa_collab",   name: "Collab",   type: "select", order_by: "menu_order", has_archives: true  },
];

// ── Canonical size ordering (menu_order for pa_size terms) ───────────────────
// Lower = shown first. Unknown sizes fall back to alphabetical via order 999.
export const SIZE_MENU_ORDER: Record<string, number> = {
  xs:  1,
  s:   2,
  m:   3,
  l:   4,
  xl:  5,
  "2xl": 6,
  "3xl": 7,
  "4xl": 8,
  os:  50,          // "One Size"
  "one-size": 50,
};

// ── Size label normalization: input → canonical label ────────────────────────
// Used to dedupe "XXL" / "2XL" / "X-Large" and produce a clean display value.
// Keys must be lowercased + whitespace/hyphen-stripped.
export const SIZE_LABEL_NORMALIZATION: Record<string, string> = {
  // Short forms
  xs: "XS", s: "S", m: "M", l: "L", xl: "XL",
  xxl: "2XL", "2xl": "2XL",
  xxxl: "3XL", "3xl": "3XL",
  xxxxl: "4XL", "4xl": "4XL",
  // Long forms
  "x-small": "XS", xsmall: "XS",
  small: "S",
  medium: "M",
  large: "L",
  "x-large": "XL", xlarge: "XL",
  "xx-large": "2XL", xxlarge: "2XL",
  "xxx-large": "3XL", xxxlarge: "3XL",
  // One-size variants
  os: "One Size",
  "one-size": "One Size",
  "one size": "One Size",
  onesize: "One Size",
  default: "Default",
};

// ── Category tree (mirrors docs/04-backend-woocommerce.md §2) ────────────────
export interface CategoryDef {
  slug: string;
  name: string;
  parent?: string;        // parent slug (undefined = top-level)
  description?: string;
}

export const CATEGORY_TREE: CategoryDef[] = [
  // Top levels
  { slug: "apparel",     name: "Apparel",     description: "Heavyweight street-gym apparel built for R1P athletes." },
  { slug: "headwear",    name: "Headwear",    description: "Caps, snapbacks, and beanies." },
  { slug: "accessories", name: "Accessories", description: "Bags, socks, and everyday carry." },
  { slug: "collabs",     name: "Collabs",     description: "Limited-edition collaborations." },
  { slug: "drops",       name: "Drops",       description: "Seasonal and limited drops." },

  // Apparel sub-categories
  { slug: "tees",        name: "Tees",        parent: "apparel", description: "Heavyweight graphic tees." },
  { slug: "hoodies",     name: "Hoodies",     parent: "apparel", description: "Premium hoodies and sweatshirts." },
  { slug: "crewnecks",   name: "Crewnecks",   parent: "apparel", description: "Heavyweight crewnecks." },
  { slug: "tanks",       name: "Tanks",       parent: "apparel", description: "Tank tops and cut-offs." },
  { slug: "shorts",      name: "Shorts",      parent: "apparel", description: "Training shorts." },
  { slug: "joggers",     name: "Joggers",     parent: "apparel", description: "Sweatpants and joggers." },
  { slug: "outerwear",   name: "Outerwear",   parent: "apparel", description: "Jackets and coats." },
  { slug: "compression", name: "Compression", parent: "apparel", description: "Compression tops and bottoms." },

  // Accessories sub-categories
  { slug: "bags",        name: "Bags",        parent: "accessories", description: "Totes and duffel bags." },
  { slug: "socks",       name: "Socks",       parent: "accessories", description: "Athletic socks." },

  // Tops — broader umbrella above tees (for filtering + faith collection)
  { slug: "tops",        name: "Tops",        parent: "apparel",     description: "Tops — tees, tanks, and lightweight uppers." },

  // Collections + sub-collections
  { slug: "collections", name: "Collections", description: "Exclusive R1P Fitness themed collections." },
  { slug: "faith",       name: "Faith",       parent: "collections", description: "Faith-inspired apparel — wear your beliefs." },
];

// ── SKU category codes (short tokens for `R1P-{CAT}-{STYLE}-{COLOR}-{SIZE}`) ──
export const SKU_CAT_CODE: Record<string, string> = {
  tees:        "TEE",
  hoodies:     "HDY",
  crewnecks:   "CRW",
  tanks:       "TNK",
  shorts:      "SHT",
  joggers:     "JGR",
  outerwear:   "JKT",
  compression: "CMP",
  headwear:    "HAT",
  bags:        "BAG",
  socks:       "SCK",
  accessories: "ACC",
  collabs:     "CLB",
  drops:       "DRP",
  apparel:     "APP",          // fallback
};

// Max Woo SKU length enforced in WC core: 100 chars, but docs say 40 for ours.
export const SKU_MAX_LENGTH = 40;

// ── Yoast SEO meta keys ──────────────────────────────────────────────────────
export const YOAST_META = {
  title: "_yoast_wpseo_title",
  desc:  "_yoast_wpseo_metadesc",
  focus: "_yoast_wpseo_focuskw",
} as const;

// ── Shopify CSV metafield column → ACF-style post_meta key ───────────────────
// Column header regexes map into cleaner post_meta keys that ACF Pro can wire to.
export const METAFIELD_COLUMN_MAP: Array<{ match: RegExp; key: keyof import("./types").ShopifyMetafields }> = [
  { match: /activity.*metafields\.shopify\.activity/i,                    key: "activity" },
  { match: /age group.*metafields\.shopify\.age-group/i,                  key: "age_group" },
  { match: /clothing features.*metafields\.shopify\.clothing-features/i,  key: "clothing_features" },
  { match: /activewear clothing features/i,                               key: "activewear_features" },
  { match: /color.*metafields\.shopify\.color-pattern/i,                  key: "color_pattern" },
  { match: /fabric.*metafields\.shopify\.fabric/i,                        key: "fabric" },
  { match: /^fit \(product\.metafields\.shopify\.fit\)/i,                 key: "fit" },
  { match: /neckline.*metafields\.shopify\.neckline/i,                    key: "neckline" },
  { match: /sleeve length type/i,                                         key: "sleeve_length" },
  { match: /top length type/i,                                            key: "top_length" },
  { match: /target gender/i,                                              key: "target_gender" },
  { match: /waist rise/i,                                                 key: "waist_rise" },
  { match: /pants length type/i,                                          key: "pants_length" },
  { match: /headwear features/i,                                          key: "headwear_features" },
  { match: /accessory size/i,                                             key: "accessory_size" },
  { match: /bag\/case material/i,                                         key: "bag_case_material" },
  { match: /bag\/case features/i,                                         key: "bag_case_features" },
  { match: /bag\/case storage features/i,                                 key: "bag_case_storage_features" },
  { match: /carry options/i,                                              key: "carry_options" },
  { match: /flavor.*metafields\.shopify\.flavor/i,                        key: "flavor" },
  { match: /dietary preferences/i,                                        key: "dietary_preferences" },
  { match: /ticket type/i,                                                key: "ticket_type" },
  { match: /search product boosts/i,                                      key: "search_boosts" },
];

// ── Tag routing ──────────────────────────────────────────────────────────────
// When a Shopify tag has a prefix like `collection:hustler`, we route it to:
//   - a global attribute term
//   - a Woo category
//   - a meta key
//   - or just a plain tag
export type TagTarget =
  | { kind: "pa_term"; taxonomy: string }
  | { kind: "category"; slug?: string }          // slug undefined → use tag value
  | { kind: "meta"; key: string }
  | { kind: "tag" }
  | { kind: "drop" }
  | { kind: "bundle" }
  | { kind: "drop-flag" }
  | { kind: "ignore" };

export const TAG_PREFIX_ROUTING: Record<string, TagTarget> = {
  collection: { kind: "category" },
  drop:       { kind: "drop" },            // routes to pa_drop + sets _is_drop = 1
  bundle:     { kind: "bundle" },          // routes to _bundle_codes meta
  fit:        { kind: "pa_term", taxonomy: "pa_fit" },
  gender:     { kind: "meta", key: "_target_gender_tag" },
  type:       { kind: "ignore" },          // we derive category from Product Category
  // `style:` in Shopify is a design-style label (graphic, vintage, minimal) —
  // kept as plain tags, not a global attribute.
  style:      { kind: "tag" },
  limited:    { kind: "drop-flag" },
  new:        { kind: "tag" },
  preorder:   { kind: "meta", key: "_is_preorder" },
  access:     { kind: "meta", key: "_access_gate" },  // access:offline → _access_gate=offline
  perk:       { kind: "meta", key: "_perk_code" },
  internal:   { kind: "ignore" },
};

// ── Google category → Woo category slug mapping ──────────────────────────────
// Applied longest-match-first on the Shopify "Product Category" column.
export const GOOGLE_CATEGORY_MAP: Array<{ contains: string; woo: string }> = [
  { contains: "Activewear Tops > Tank Tops",                            woo: "tanks" },
  { contains: "Activewear Sweatshirts & Hoodies > Hoodies",             woo: "hoodies" },
  { contains: "Activewear Sweatshirts & Hoodies > Sweatshirts",         woo: "crewnecks" },
  { contains: "Activewear Pants > Shorts",                              woo: "shorts" },
  { contains: "Activewear Pants > Joggers",                             woo: "joggers" },
  { contains: "Activewear Pants > Sweatpants",                          woo: "joggers" },
  { contains: "Activewear Pants > Leggings",                            woo: "compression" },
  { contains: "Activewear Tops > T-Shirts",                             woo: "tees" },
  { contains: "Clothing Tops > T-Shirts",                               woo: "tees" },
  { contains: "Clothing Tops > Tank Tops",                              woo: "tanks" },
  { contains: "Clothing Tops",                                          woo: "tees" },
  { contains: "Outerwear > Coats & Jackets",                            woo: "outerwear" },
  { contains: "Clothing Accessories > Hats > Baseball Caps",            woo: "headwear" },
  { contains: "Clothing Accessories > Hats > Snapback Caps",            woo: "headwear" },
  { contains: "Clothing > Socks",                                       woo: "socks" },
  { contains: "Handbags, Wallets & Cases",                              woo: "bags" },
  { contains: "Luggage & Bags > Tote Bags",                             woo: "bags" },
  { contains: "Luggage & Bags > Duffel Bags",                           woo: "bags" },
  { contains: "Luggage & Bags",                                         woo: "bags" },
  { contains: "Clothing > Activewear",                                  woo: "tees" },  // generic fallback inside activewear
  { contains: "Apparel & Accessories",                                  woo: "tees" },  // last-resort apparel fallback
];

// ── Handle-keyword fallbacks (used when Product Category is empty) ───────────
export const HANDLE_CATEGORY_FALLBACK: Array<{ match: RegExp; woo: string }> = [
  { match: /hat|snapback|\bcap\b|5-panel/i, woo: "headwear" },
  { match: /hoodie|zip-up/i,                woo: "hoodies" },
  { match: /crewneck/i,                     woo: "crewnecks" },
  { match: /short/i,                        woo: "shorts" },
  { match: /sweatpant|jogger/i,             woo: "joggers" },
  { match: /sock/i,                         woo: "socks" },
  { match: /tote|duffel|bag/i,              woo: "bags" },
  { match: /cut-off|tank/i,                 woo: "tanks" },
  { match: /jacket|coat/i,                  woo: "outerwear" },
  { match: /legging|compression/i,          woo: "compression" },
  { match: /tee|t-shirt|shirt/i,            woo: "tees" },
];

// ── Non-apparel exclusion rules ───────────────────────────────────────────────
/**
 * Build-time rules that skip a product before it hits the exclude manifest.
 * Manifest (`scripts/seed/exclude-manifest.ts`) is for explicit per-handle exclusions.
 */
export const SKIP_GOOGLE_CATEGORY_PREFIXES = [
  "Food, Beverages",
  "Health & Beauty",
  "Services",
];

// Slug codes used when building SKUs, to keep them short.
export const COLOR_ABBR: Record<string, string> = {
  black: "BLK", white: "WHT", cream: "CRM", grey: "GRY", gray: "GRY",
  charcoal: "CHR", "heather-grey": "HGR", "heather-gray": "HGR",
  navy: "NVY", blue: "BLU", "royal-blue": "RBL",
  red: "RED", maroon: "MRN", burgundy: "BUR", crimson: "CRM2",
  green: "GRN", olive: "OLV", forest: "FST", sage: "SGE",
  yellow: "YLW", gold: "GLD",
  orange: "ORG", coral: "CRL",
  pink: "PNK", blush: "BLU2",
  purple: "PRP", lavender: "LAV",
  tan: "TAN", khaki: "KHK", beige: "BGE", sand: "SND",
  brown: "BRN", chocolate: "CHC",
  multi: "MLT", camo: "CAM",
};
