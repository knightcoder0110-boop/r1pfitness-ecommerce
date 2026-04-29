/**
 * scripts/seed/transforms.ts
 *
 * Shapes a raw Shopify ProductGroup into a PlannedProduct ready for Woo.
 *
 * Key responsibilities:
 *   1. Filter non-apparel and excluded items
 *   2. Split the "Beast Mode" CSV row into 4 separate products (one per animal)
 *   3. Route Shopify Options + tags + metafields onto global pa_* attributes
 *   4. Generate deterministic SKUs: `R1P-{CAT}-{STYLE}-{COLOR}-{SIZE}`
 *   5. Map Google Product Category → Woo category slug (with handle-fallback)
 *   6. Clean Shopify TipTap artifacts (data-path-to-node, data-start, etc.)
 *   7. Write Yoast + ACF post_meta
 */

import {
  DEFAULT_STOCK,
  DEFAULT_STOCK_STATUS,
  SIZE_LABEL_NORMALIZATION,
  SIZE_MENU_ORDER,
  TIER_LABEL_NORMALIZATION,
  TIER_MENU_ORDER,
  STYLE_MENU_ORDER,
  GOOGLE_CATEGORY_MAP,
  HANDLE_CATEGORY_FALLBACK,
  HANDLE_CATEGORY_OVERRIDE,
  SKIP_GOOGLE_CATEGORY_PREFIXES,
  TAG_PREFIX_ROUTING,
  CATEGORY_TREE,
  SKU_CAT_CODE,
  SKU_MAX_LENGTH,
  YOAST_META,
  COLOR_ABBR,
} from "./config";
import { buildExcludeIndex } from "./exclude-manifest";
import type {
  ProductGroup,
  PlannedProduct,
  PlannedVariant,
  SkippedItem,
  ShopifyMetafields,
} from "./types";

// ──────────────────────────────────────────────────────────────────────────────
// 1. Filtering
// ──────────────────────────────────────────────────────────────────────────────

export interface FilterResult {
  accepted: ProductGroup[];
  skipped: SkippedItem[];
}

export function filterGroups(
  groups: Map<string, ProductGroup>,
  opts: { includeManifest: boolean },
): FilterResult {
  const excludeIdx = opts.includeManifest ? new Map<string, string>() : buildExcludeIndex();
  const accepted: ProductGroup[] = [];
  const skipped: SkippedItem[] = [];

  for (const g of groups.values()) {
    // 1a) Explicit manifest
    const manualReason = excludeIdx.get(g.handle);
    if (manualReason) {
      skipped.push({ handle: g.handle, title: g.title, reason: "manual-exclude", detail: manualReason });
      continue;
    }

    // 1b) Non-apparel Google category
    const hit = SKIP_GOOGLE_CATEGORY_PREFIXES.find((p) => g.productCategory.startsWith(p));
    if (hit) {
      skipped.push({ handle: g.handle, title: g.title, reason: "non-apparel-category", detail: g.productCategory });
      continue;
    }

    // 1c) Archived
    if (g.status === "archived") {
      skipped.push({ handle: g.handle, title: g.title, reason: "archived", detail: `status=${g.status}` });
      continue;
    }

    // 1d) No images (unsellable)
    if (g.images.length === 0) {
      skipped.push({ handle: g.handle, title: g.title, reason: "no-images", detail: "0 images in CSV" });
      continue;
    }

    // 1e) Empty product (no variants at all)
    if (g.variants.length === 0) {
      skipped.push({ handle: g.handle, title: g.title, reason: "empty-product", detail: "0 variants" });
      continue;
    }

    accepted.push(g);
  }

  return { accepted, skipped };
}

// ──────────────────────────────────────────────────────────────────────────────
// 2. Beast Mode splitter
// ──────────────────────────────────────────────────────────────────────────────

/**
 * The handle `beast-mode-cut-off-vintage-tees-collection` is one Shopify product
 * whose variants encode 4 distinct animal tees via Option3. That's a modelling
 * bug. We emit 4 real products instead.
 */
export function splitBeastMode(groups: ProductGroup[]): ProductGroup[] {
  const out: ProductGroup[] = [];
  for (const g of groups) {
    if (g.handle !== "beast-mode-cut-off-vintage-tees-collection") {
      out.push(g);
      continue;
    }

    // Group variants by opt3 (the animal) OR, if opt3 empty, by title substring.
    const byAnimal = new Map<string, typeof g.variants>();
    for (const v of g.variants) {
      const animal = (v.opt3 || extractAnimalFromTitle(g.title) || "BEAST").toUpperCase();
      const list = byAnimal.get(animal) ?? [];
      list.push(v);
      byAnimal.set(animal, list);
    }

    for (const [animal, variants] of byAnimal.entries()) {
      const animalLower = animal.toLowerCase();
      const split: ProductGroup = {
        ...g,
        handle: `beast-mode-${animalLower}-cut-off-tee`,
        title: `Beast Mode ${capitalize(animalLower)} Cut-Off Tee`,
        seoTitle: `Beast Mode ${capitalize(animalLower)} Cut-Off Tee — R1P Fitness`,
        opt3Name: "",                // remove the malformed opt3 dimension
        variants: variants.map((v) => ({ ...v, opt3: "" })),
        // Filter images that reference this animal's art, keep all if we can't tell
        images: g.images.filter((im) => {
          const low = (im.src + " " + im.alt).toLowerCase();
          return low.includes(animalLower) || g.images.length < 4;
        }),
      };
      // If filtering left us image-less, restore the full image set
      if (split.images.length === 0) split.images = g.images;
      out.push(split);
    }
  }
  return out;
}

function extractAnimalFromTitle(title: string): string | null {
  const m = title.match(/\b(bear|tiger|lion|gorilla|wolf|eagle)\b/i);
  return m ? m[1]!.toUpperCase() : null;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ──────────────────────────────────────────────────────────────────────────────
// 3. Size / color / style helpers
// ──────────────────────────────────────────────────────────────────────────────

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function normalizeTierLabel(raw: string): string {
  const key = raw.trim().toLowerCase().replace(/\s{2,}/g, " ").replace(/\u2014.*$/, "").trim();
  return TIER_LABEL_NORMALIZATION[key] ?? raw.trim();
}

export function tierSlug(label: string): string {
  return slugify(normalizeTierLabel(label));
}

export function tierMenuOrder(slug: string): number {
  return TIER_MENU_ORDER[slug] ?? 999;
}

export function styleMenuOrder(slug: string): number {
  return STYLE_MENU_ORDER[slug] ?? 999;
}

export function normalizeSizeLabel(raw: string): string {
  // Normalize: lowercase, collapse whitespace, strip non-word except hyphen
  const key = raw.trim().toLowerCase().replace(/\s+/g, "-");
  if (SIZE_LABEL_NORMALIZATION[key]) return SIZE_LABEL_NORMALIZATION[key]!;
  // Try without hyphens (e.g. "X-Large" already normalized, but handle "XLarge")
  const noHyphen = key.replace(/-/g, "");
  if (SIZE_LABEL_NORMALIZATION[noHyphen]) return SIZE_LABEL_NORMALIZATION[noHyphen]!;
  return raw.trim().toUpperCase();
}

export function sizeSlug(label: string): string {
  const l = label.toLowerCase().replace(/\s+/g, "-");
  return SIZE_LABEL_NORMALIZATION[l] ? slugify(SIZE_LABEL_NORMALIZATION[l]!) : slugify(l);
}

export function sizeMenuOrder(slug: string): number {
  return SIZE_MENU_ORDER[slug] ?? 999;
}

export function colorAbbr(colorLabel: string): string {
  const slug = slugify(colorLabel);
  if (COLOR_ABBR[slug]) return COLOR_ABBR[slug]!;
  // Fallback: uppercase first 3 alphanumeric chars
  return slug.replace(/[^a-z0-9]/g, "").slice(0, 3).toUpperCase() || "XXX";
}

export function styleCode(handle: string): string {
  // Use handle tokens, strip filler words, cap at 10 chars uppercase.
  const tokens = handle
    .split("-")
    .filter((t) => !/^(the|of|and|for|fitness|r1p|r1pfitness|collection|tee|t-?shirt|hoodie|cap|hat|shorts|socks)$/i.test(t));
  const code = (tokens.join("").slice(0, 10) || handle.slice(0, 10)).toUpperCase();
  return code.replace(/[^A-Z0-9]/g, "");
}

// ──────────────────────────────────────────────────────────────────────────────
// 4. Category routing
// ──────────────────────────────────────────────────────────────────────────────

const CATEGORY_LOOKUP = new Map(CATEGORY_TREE.map((c) => [c.slug, c]));

export function resolveCategory(g: ProductGroup): string {
  // Per-handle override takes priority over all other rules
  if (HANDLE_CATEGORY_OVERRIDE[g.handle]) return HANDLE_CATEGORY_OVERRIDE[g.handle]!;

  // Try longest Google taxonomy match first
  const byGoogle = [...GOOGLE_CATEGORY_MAP]
    .sort((a, b) => b.contains.length - a.contains.length)
    .find((m) => g.productCategory.includes(m.contains));
  if (byGoogle) return byGoogle.woo;

  // Fallback to handle keyword
  const byHandle = HANDLE_CATEGORY_FALLBACK.find((m) => m.match.test(g.handle) || m.match.test(g.title));
  if (byHandle) return byHandle.woo;

  return "tees"; // last resort
}

/**
 * Returns the full category chain (child first) — e.g. for "tees": [tees, apparel].
 * This is used so the Woo product gets assigned to BOTH leaf and parent, which
 * is what the storefront category nav expects.
 */
export function resolveCategoryChain(g: ProductGroup): Array<{ slug: string; name: string; parent?: string }> {
  const leafSlug = resolveCategory(g);
  const chain: Array<{ slug: string; name: string; parent?: string }> = [];
  let current = CATEGORY_LOOKUP.get(leafSlug);
  while (current) {
    chain.push({ slug: current.slug, name: current.name, parent: current.parent });
    current = current.parent ? CATEGORY_LOOKUP.get(current.parent) : undefined;
  }
  return chain;
}

// ──────────────────────────────────────────────────────────────────────────────
// 5. Tag parser
// ──────────────────────────────────────────────────────────────────────────────

export interface RoutedTags {
  plainTags: string[];
  drops: string[];                 // pa_drop term labels
  bundleCodes: string[];
  collabs: string[];               // pa_collab term labels
  fits: string[];                  // pa_fit term labels
  metas: Array<{ key: string; value: string }>;
  flags: { isLimited: boolean; isNew: boolean; isPreorder: boolean; accessGate?: string };
}

export function routeTags(rawTags: string): RoutedTags {
  const out: RoutedTags = {
    plainTags: [],
    drops: [],
    bundleCodes: [],
    collabs: [],
    fits: [],
    metas: [],
    flags: { isLimited: false, isNew: false, isPreorder: false },
  };
  if (!rawTags.trim()) return out;

  const seen = new Set<string>();
  for (const raw of rawTags.split(",")) {
    const t = raw.trim();
    if (!t) continue;
    if (seen.has(t.toLowerCase())) continue;
    seen.add(t.toLowerCase());

    // Skip Shopify system tags
    if (t.startsWith("gid://") || t.toLowerCase().startsWith("product.metafields")) continue;
    if (/^google/i.test(t)) continue;

    // Prefix routing
    const colon = t.indexOf(":");
    if (colon > 0) {
      const prefix = t.slice(0, colon).trim().toLowerCase();
      const value = t.slice(colon + 1).trim();
      const rule = TAG_PREFIX_ROUTING[prefix];
      if (!rule) {
        out.plainTags.push(`${prefix}:${value}`);
        continue;
      }
      switch (rule.kind) {
        case "drop":
          if (value) out.drops.push(value);
          break;
        case "bundle":
          if (value) out.bundleCodes.push(value);
          break;
        case "pa_term":
          if (rule.taxonomy === "pa_fit" && value) out.fits.push(value);
          else if (rule.taxonomy === "pa_collab" && value) out.collabs.push(value);
          break;
        case "meta":
          if (value) out.metas.push({ key: rule.key, value });
          if (prefix === "access" && value.toLowerCase() === "offline") out.flags.accessGate = "offline";
          if (prefix === "preorder") out.flags.isPreorder = true;
          break;
        case "drop-flag":
          out.flags.isLimited = true;
          break;
        case "category":
          // Collection tags become plain tags; leaf category comes from Google taxonomy.
          out.plainTags.push(value);
          break;
        case "tag":
          if (prefix === "new") out.flags.isNew = true;
          out.plainTags.push(value);
          break;
        case "ignore":
          break;
      }
    } else {
      out.plainTags.push(t);
    }
  }
  return out;
}

// ──────────────────────────────────────────────────────────────────────────────
// 6. Global attribute builder
// ──────────────────────────────────────────────────────────────────────────────

interface AttrAccumulator {
  taxonomy: string;
  name: string;
  termLabels: Map<string, string>;           // slug -> label
  termMenuOrder: Map<string, number>;
  variation: boolean;
}

function newAccumulator(taxonomy: string, name: string, variation = true): AttrAccumulator {
  return { taxonomy, name, termLabels: new Map(), termMenuOrder: new Map(), variation };
}

function addTerm(acc: AttrAccumulator, label: string, menuOrder?: number): { slug: string; label: string } {
  const slug = slugify(label);
  if (!slug) return { slug: "", label };
  if (!acc.termLabels.has(slug)) acc.termLabels.set(slug, label);
  if (menuOrder !== undefined) acc.termMenuOrder.set(slug, menuOrder);
  return { slug, label };
}

/**
 * Map a Shopify Option name to a global attribute taxonomy.
 * Returns null for dimensions we should ignore (e.g. "Title" placeholder,
 * protein-shake "Vanilla"/"Chocolate" flavors on excluded products, etc.).
 */
function routeOptionName(optName: string): { taxonomy: string; name: string } | null {
  const n = optName.trim().toLowerCase();
  if (!n || n === "title") return null;
  if (n === "size" || n === "sock length") return { taxonomy: "pa_size", name: "Size" };
  if (n === "color") return { taxonomy: "pa_color", name: "Color" };
  if (n === "fit") return { taxonomy: "pa_fit", name: "Fit" };
  // "Style" on the mystery box = Male / Female / Unisex — a real variation axis.
  if (n === "style") return { taxonomy: "pa_style", name: "Style" };
  // "Tier" on the mystery box = Starter Pack / Pro Pack / Grail Pack / Mega Tier.
  if (n === "tier") return { taxonomy: "pa_tier", name: "Tier" };
  // Unknown option — skip rather than pollute the global namespace
  return null;
}

interface BuiltAttributes {
  attributes: PlannedProduct["attributes"];
  /** Per-variant mapping: variant index → attribute slug → term slug */
  variantTerms: Map<number, Array<{ taxonomy: string; name: string; termSlug: string; termLabel: string }>>;
}

export function buildAttributes(g: ProductGroup, routed: RoutedTags): BuiltAttributes {
  const accumulators = new Map<string, AttrAccumulator>();

  const ensureAcc = (taxonomy: string, name: string, variation = true): AttrAccumulator => {
    let a = accumulators.get(taxonomy);
    if (!a) {
      a = newAccumulator(taxonomy, name, variation);
      accumulators.set(taxonomy, a);
    }
    return a;
  };

  // Track per-variant attribute mapping
  const variantTerms = new Map<number, Array<{ taxonomy: string; name: string; termSlug: string; termLabel: string }>>();

  // Helper: given an option name and option value, return the term to record
  const handleOption = (optName: string, optValue: string, vi: number): void => {
    if (!optValue) return;
    const route = routeOptionName(optName);
    if (!route) return;
    const acc = ensureAcc(route.taxonomy, route.name, true);
    let label = optValue;
    let menuOrder: number | undefined;
    if (route.taxonomy === "pa_size") {
      label = normalizeSizeLabel(optValue);
      menuOrder = sizeMenuOrder(sizeSlug(label));
    } else if (route.taxonomy === "pa_tier") {
      label = normalizeTierLabel(optValue);
      menuOrder = tierMenuOrder(tierSlug(optValue));
    } else if (route.taxonomy === "pa_style") {
      menuOrder = styleMenuOrder(slugify(optValue));
    }
    const term = addTerm(acc, label, menuOrder);
    if (!term.slug) return;
    const list = variantTerms.get(vi) ?? [];
    list.push({ taxonomy: route.taxonomy, name: route.name, termSlug: term.slug, termLabel: label });
    variantTerms.set(vi, list);
  };

  for (let vi = 0; vi < g.variants.length; vi++) {
    const v = g.variants[vi]!;
    handleOption(g.opt1Name, v.opt1, vi);
    handleOption(g.opt2Name, v.opt2, vi);
    // opt3 is often malformed Shopify data (e.g. LION style); only honour if opt3Name is real
    if (g.opt3Name && g.opt3Name.trim() && g.opt3Name.trim().toLowerCase() !== "title") {
      handleOption(g.opt3Name, v.opt3, vi);
    }
  }

  // Non-variation attributes from tag routing (drop, collab, fit)
  if (routed.drops.length > 0) {
    const acc = ensureAcc("pa_drop", "Drop", false);
    for (const d of routed.drops) addTerm(acc, d);
  }
  if (routed.collabs.length > 0) {
    const acc = ensureAcc("pa_collab", "Collab", false);
    for (const c of routed.collabs) addTerm(acc, c);
  }
  if (routed.fits.length > 0 && !accumulators.has("pa_fit")) {
    // Only add pa_fit if no variant already contributes to it
    const acc = ensureAcc("pa_fit", "Fit", false);
    for (const f of routed.fits) addTerm(acc, f);
  }

  // Metafield-driven non-variation attributes: fabric → pa_material, color-pattern → pa_color (if not already)
  const mf = g.metafields;
  if (mf.fabric) {
    const acc = ensureAcc("pa_material", "Material", false);
    for (const f of splitMetafieldList(mf.fabric)) addTerm(acc, f);
  }
  if (mf.color_pattern && !accumulators.has("pa_color")) {
    const acc = ensureAcc("pa_color", "Color", false);
    for (const c of splitMetafieldList(mf.color_pattern)) addTerm(acc, c);
  }

  // Build final attribute array
  let position = 0;
  const attributes: PlannedProduct["attributes"] = [];
  // Deterministic order: size, color, fit, collab, drop, material, style, tier
  const order = ["pa_size", "pa_color", "pa_fit", "pa_collab", "pa_drop", "pa_material", "pa_style", "pa_tier"];
  const seen = new Set<string>();
  const emit = (taxonomy: string) => {
    const a = accumulators.get(taxonomy);
    if (!a || seen.has(taxonomy)) return;
    seen.add(taxonomy);
    const termLabels: Record<string, string> = {};
    const termMenuOrder: Record<string, number> = {};
    for (const [slug, label] of a.termLabels.entries()) termLabels[slug] = label;
    for (const [slug, mo] of a.termMenuOrder.entries()) termMenuOrder[slug] = mo;
    attributes.push({
      slug: taxonomy,
      name: a.name,
      position: position++,
      visible: true,
      variation: a.variation,
      options: Array.from(a.termLabels.keys()),
      termLabels,
      termMenuOrder: Object.keys(termMenuOrder).length > 0 ? termMenuOrder : undefined,
    });
  };
  for (const tax of order) emit(tax);
  for (const tax of accumulators.keys()) emit(tax);

  return { attributes, variantTerms };
}

function splitMetafieldList(v: string): string[] {
  // Shopify multi-value metafields arrive comma-separated inside brackets or as JSON arrays sometimes.
  return v
    .replace(/^\[|\]$/g, "")
    .split(/,|;/)
    .map((s) => s.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);
}

// ──────────────────────────────────────────────────────────────────────────────
// 7. SKU generator
// ──────────────────────────────────────────────────────────────────────────────

/**
 * `R1P-{CAT}-{STYLE}-{COLOR}-{SIZE}` ≤ 40 chars, uppercase.
 * Deterministic: same input → same SKU.
 * Falls back to sanitised Shopify SKU if present.
 */
export function generateSku(
  categorySlug: string,
  handle: string,
  variant: { opt1: string; opt2: string; opt3: string; sku: string },
  opt1Name: string,
  opt2Name: string,
  _opt3Name: string,
): string {
  // Prefer Shopify SKU if it looks reasonable
  if (variant.sku && /^[A-Z0-9-]+$/i.test(variant.sku) && variant.sku.length <= SKU_MAX_LENGTH) {
    return variant.sku.toUpperCase();
  }

  const cat = SKU_CAT_CODE[categorySlug] ?? "APP";
  const style = styleCode(handle);

  // Figure out which option is color vs size
  let colorVal = "", sizeVal = "";
  const map = (name: string, val: string) => {
    const n = name.trim().toLowerCase();
    if (n === "color") colorVal = val;
    else if (n === "size" || n === "sock length") sizeVal = val;
    else if (n === "style") styleVal = val;
    else if (n === "tier") tierVal = val;
  };
  let styleVal = "", tierVal = "";
  map(opt1Name, variant.opt1);
  map(opt2Name, variant.opt2);
  map(_opt3Name, variant.opt3);

  const color = colorVal ? colorAbbr(colorVal) : "";
  const size = sizeVal ? slugify(normalizeSizeLabel(sizeVal)).toUpperCase() : "";
  // Encode style (M/F/U) and tier abbreviation so mystery box variants get unique SKUs
  const styleAbbr = styleVal ? styleVal.trim().toUpperCase().slice(0, 1) : "";
  const tierAbbr = tierVal
    ? normalizeTierLabel(tierVal).split(" ").map((w) => w[0]!.toUpperCase()).join("").slice(0, 4)
    : "";

  const parts = ["R1P", cat, style, color, styleAbbr, tierAbbr, size].filter(Boolean);
  let sku = parts.join("-");
  if (sku.length > SKU_MAX_LENGTH) {
    // Truncate the style portion
    const overflow = sku.length - SKU_MAX_LENGTH;
    const shortened = style.slice(0, Math.max(3, style.length - overflow));
    sku = ["R1P", cat, shortened, color, styleAbbr, tierAbbr, size].filter(Boolean).join("-");
  }
  return sku;
}

// ──────────────────────────────────────────────────────────────────────────────
// 8. Description cleaner
// ──────────────────────────────────────────────────────────────────────────────

const TIPTAP_ATTRS = [
  /\sdata-path-to-node="[^"]*"/g,
  /\sdata-start="[^"]*"/g,
  /\sdata-end="[^"]*"/g,
  /\sdata-index-in-node="[^"]*"/g,
  /\sdata-section-id="[^"]*"/g,
  /\sdata-node-id="[^"]*"/g,
];

export function cleanDescription(html: string): string {
  let out = html;
  for (const re of TIPTAP_ATTRS) out = out.replace(re, "");
  // Strip empty <p></p> that become <p> </p> after cleanup
  out = out.replace(/<p[^>]*>\s*<\/p>/g, "");
  // Collapse excessive whitespace
  out = out.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n");
  return out.trim();
}

// ──────────────────────────────────────────────────────────────────────────────
// 9. Metafield → post_meta
// ──────────────────────────────────────────────────────────────────────────────

export function metafieldsToMeta(mf: ShopifyMetafields): Array<{ key: string; value: string }> {
  const out: Array<{ key: string; value: string }> = [];
  for (const [k, v] of Object.entries(mf)) {
    if (v) out.push({ key: k, value: v });
  }
  return out;
}

// ──────────────────────────────────────────────────────────────────────────────
// 10. Pricing sanity
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Returns { regular_price, sale_price? } based on Shopify price + compareAt.
 * Valid sale requires compareAt > price && compareAt > 0.
 */
export function reconcilePrice(price: string, compareAt: string): { regular_price: string; sale_price?: string } {
  const p = parseFloat(price || "0");
  const c = parseFloat(compareAt || "0");
  if (c > 0 && c > p && p > 0) {
    // It's a real sale: compareAt is original, price is discounted
    return { regular_price: c.toFixed(2), sale_price: p.toFixed(2) };
  }
  return { regular_price: (p > 0 ? p : c).toFixed(2) };
}

// ──────────────────────────────────────────────────────────────────────────────
// 11. Full planner
// ──────────────────────────────────────────────────────────────────────────────

export function planProduct(g: ProductGroup): PlannedProduct {
  const routed = routeTags(g.tags);
  const categoryChain = resolveCategoryChain(g);
  const leafCat = categoryChain[0]?.slug ?? "tees";

  // Collab as category if present
  if (routed.collabs.length > 0 && !categoryChain.some((c) => c.slug === "collabs")) {
    categoryChain.push({ slug: "collabs", name: "Collabs" });
  }
  // Drop as category if present
  if (routed.drops.length > 0 && !categoryChain.some((c) => c.slug === "drops")) {
    categoryChain.push({ slug: "drops", name: "Drops" });
  }

  const { attributes, variantTerms } = buildAttributes(g, routed);

  // Preserve Shopify "Style" option values as meta (not a global attribute).
  const styleValues = new Set<string>();
  for (const v of g.variants) {
    if (g.opt1Name.trim().toLowerCase() === "style" && v.opt1) styleValues.add(v.opt1);
    if (g.opt2Name.trim().toLowerCase() === "style" && v.opt2) styleValues.add(v.opt2);
  }

  // Publish status
  const isOnline =
    g.published &&
    g.status === "active" &&
    routed.flags.accessGate !== "offline";
  const wooStatus: "publish" | "draft" = isOnline ? "publish" : "draft";

  // Determine simple vs variable (any real variation axis?)
  const hasVariationAxis = attributes.some((a) => a.variation && a.options.length > 0);
  const productType: "simple" | "variable" = hasVariationAxis ? "variable" : "simple";

  // Variants
  const plannedVariants: PlannedVariant[] = [];
  if (productType === "variable") {
    for (let vi = 0; vi < g.variants.length; vi++) {
      const v = g.variants[vi]!;
      const terms = (variantTerms.get(vi) ?? []).filter((t) =>
        attributes.some((a) => a.variation && a.slug === t.taxonomy),
      );
      if (terms.length === 0) continue; // skip variant that has no variation axis (e.g. opt3-only)

      const { regular_price, sale_price } = reconcilePrice(v.price, v.compareAt);
      const sku = generateSku(leafCat, g.handle, v, g.opt1Name, g.opt2Name, g.opt3Name);
      const pv: PlannedVariant = {
        sku,
        regular_price,
        stock_quantity: DEFAULT_STOCK,
        stock_status: DEFAULT_STOCK_STATUS,
        manage_stock: true,
        attributes: terms.map((t) => ({ name: t.name, slug: t.taxonomy, option: t.termSlug })),
        shopify_opt1: v.opt1,
        shopify_opt2: v.opt2,
        shopify_opt3: v.opt3,
        ...(sale_price !== undefined ? { sale_price } : {}),
        ...(v.variantImage ? { image: { src: v.variantImage } } : {}),
      };
      plannedVariants.push(pv);
    }
  }

  // Simple price (from first variant)
  const simplePrice = productType === "simple" && g.variants[0]
    ? (() => {
        const v = g.variants[0]!;
        const { regular_price, sale_price } = reconcilePrice(v.price, v.compareAt);
        const sku = generateSku(leafCat, g.handle, v, g.opt1Name, g.opt2Name, g.opt3Name);
        return {
          regular_price,
          sku,
          ...(sale_price !== undefined ? { sale_price } : {}),
        };
      })()
    : undefined;

  // Meta: Yoast + Shopify bookkeeping + ACF metafields + tag-routed meta
  const meta: Array<{ key: string; value: string }> = [];
  if (g.seoTitle) meta.push({ key: YOAST_META.title, value: g.seoTitle });
  if (g.seoDescription) meta.push({ key: YOAST_META.desc, value: g.seoDescription });
  meta.push({ key: "_shopify_handle", value: g.handle });
  if (g.vendor) meta.push({ key: "_vendor", value: g.vendor });
  if (styleValues.size > 0) meta.push({ key: "_shopify_style", value: [...styleValues].join(", ") });
  if (routed.bundleCodes.length > 0) meta.push({ key: "_bundle_codes", value: routed.bundleCodes.join(",") });
  if (routed.flags.isLimited) meta.push({ key: "_is_limited", value: "1" });
  if (routed.flags.isNew) meta.push({ key: "_is_new", value: "1" });
  if (routed.flags.isPreorder) meta.push({ key: "_is_preorder", value: "1" });
  if (routed.flags.accessGate) meta.push({ key: "_access_gate", value: routed.flags.accessGate });
  for (const m of routed.metas) meta.push(m);
  for (const m of metafieldsToMeta(g.metafields)) meta.push(m);

  return {
    sourceHandle: g.handle,
    slug: g.handle,
    name: g.title,
    type: productType,
    status: wooStatus,
    description: cleanDescription(g.bodyHtml),
    short_description: g.seoDescription || "",
    categories: categoryChain,
    tags: routed.plainTags,
    images: g.images.map((i) => ({ src: i.src, alt: i.alt || g.title })),
    attributes,
    variants: plannedVariants,
    ...(simplePrice !== undefined ? { simplePrice } : {}),
    meta,
    stock_quantity: DEFAULT_STOCK,
    stock_status: DEFAULT_STOCK_STATUS,
    manage_stock: true,
  };
}
