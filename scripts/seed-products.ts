#!/usr/bin/env tsx
/**
 * scripts/seed-products.ts
 *
 * Seeds WooCommerce with products from the Shopify export CSV.
 *
 * What it does:
 *   - Parses the Shopify product export CSV
 *   - Skips non-apparel (energy drinks, supplements, services, pins)
 *   - Creates apparel products as:
 *       · Published in WooCommerce  → if Shopify: Published=true AND Status=active AND NOT access:offline
 *       · Draft in WooCommerce      → everything else (incl. offline-only, pre-orders, drafts)
 *   - Handles simple products (hats) and variable products (size/color variations)
 *   - Idempotent: skips slugs that already exist in WooCommerce
 *   - Assigns WooCommerce categories: Tees / Caps / Hoodies / Shorts / Activewear / Accessories
 *
 * Usage:
 *   pnpm tsx scripts/seed-products.ts
 *   pnpm tsx scripts/seed-products.ts --dry-run     (preview only, no API calls)
 *
 * Requires: WOO_BASE_URL, WOO_CONSUMER_KEY, WOO_CONSUMER_SECRET in .env.local
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";

// ── Load .env.local ───────────────────────────────────────────────────────────
function loadEnv(): void {
  const envPath = join(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 0) continue;
    const key = t.slice(0, eq).trim();
    const val = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnv();

// ── Config ────────────────────────────────────────────────────────────────────
const DRY_RUN = process.argv.includes("--dry-run");
const DEFAULT_STOCK = 15;
const CSV_PATH = join(
  process.cwd(),
  "public/assets/products-files/products_export_new_full.csv"
);

const WOO_BASE_URL = process.env.WOO_BASE_URL ?? "";
const WOO_KEY = process.env.WOO_CONSUMER_KEY ?? "";
const WOO_SECRET = process.env.WOO_CONSUMER_SECRET ?? "";

if (!DRY_RUN && (!WOO_BASE_URL || !WOO_KEY || !WOO_SECRET)) {
  console.error("❌  Missing WOO_BASE_URL / WOO_CONSUMER_KEY / WOO_CONSUMER_SECRET in .env.local");
  process.exit(1);
}

const AUTH =
  "Basic " + Buffer.from(`${WOO_KEY}:${WOO_SECRET}`).toString("base64");

// ── Skip categories (not apparel) ────────────────────────────────────────────
const SKIP_CATEGORY_PREFIXES = [
  "Food, Beverages",
  "Health & Beauty",
  "Services",
];
const SKIP_HANDLES_CONTAINING = [
  "energy-drink",
  "protein-shake",
  "protein-chips",
  "gym-pass",
  "studio-rental",
  "drop-in-rate",
  "membership",
  "water",
  "milkshake",
  "bcaa",
  "pre-workout",
  "pump",
  "lanyard",
  "-pins",
  "oatmeal",
  "gatorade",
  "bodyarmour",
  "coconut",
  "reign-storm",
  "xyience",
  "uptime",
  "zoa",
  "lean-body",
  "amin-o",
  "ghost-hydration",
];
const SKIP_TITLE_KEYWORDS = ["energy drink", "protein shake", "protein pie", "body armor", "milkshake", "hydration drink"];

// ── WooCommerce API ──────────────────────────────────────────────────────────
interface WooCategory { id: number; slug: string; name: string }
interface WooProduct  { id: number; name: string; slug: string }

async function wooGet<T>(path: string): Promise<T> {
  const url = `${WOO_BASE_URL}/wp-json/wc/v3/${path}`;
  const res = await fetch(url, {
    headers: { Authorization: AUTH, "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GET ${path} → ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

async function wooPost<T>(path: string, body: unknown): Promise<T> {
  const url = `${WOO_BASE_URL}/wp-json/wc/v3/${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: AUTH, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${path} → ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.json() as Promise<T>;
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ── CSV Parser ────────────────────────────────────────────────────────────────
// Handles RFC 4180 with multi-line quoted fields (HTML descriptions).
function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  const row: string[] = [];
  let field = "";
  let inQuote = false;
  let i = 0;

  const push = () => { row.push(field); field = ""; };
  const flush = () => { push(); rows.push([...row]); row.length = 0; };

  while (i < content.length) {
    const ch = content[i]!;
    if (inQuote) {
      if (ch === '"' && content[i + 1] === '"') { field += '"'; i += 2; }
      else if (ch === '"') { inQuote = false; i++; }
      else { field += ch; i++; }
    } else {
      if (ch === '"') { inQuote = true; i++; }
      else if (ch === ',') { push(); i++; }
      else if (ch === '\r') { i++; }
      else if (ch === '\n') { flush(); i++; }
      else { field += ch; i++; }
    }
  }
  if (field || row.length > 0) flush();
  return rows;
}

// ── Column indices (0-based) ─────────────────────────────────────────────────
const C = {
  HANDLE:              0,
  TITLE:               1,
  BODY_HTML:           2,
  VENDOR:              3,
  PRODUCT_CATEGORY:    4,
  TYPE:                5,
  TAGS:                6,
  PUBLISHED:           7,
  OPT1_NAME:           8,
  OPT1_VALUE:          9,
  OPT2_NAME:           11,
  OPT2_VALUE:          12,
  OPT3_NAME:           14,
  OPT3_VALUE:          15,
  VARIANT_SKU:         17,
  VARIANT_PRICE:       22,
  VARIANT_COMPARE_AT:  23,
  IMAGE_SRC:           31,
  IMAGE_POSITION:      32,
  SEO_TITLE:           35,
  SEO_DESCRIPTION:     36,
  VARIANT_IMAGE:       82,
  STATUS:              -1, // last column
} as const;

// ── Row accessor ──────────────────────────────────────────────────────────────
function col(row: string[], idx: number): string {
  if (idx === -1) return row[row.length - 1] ?? "";
  return row[idx] ?? "";
}

// ── Product grouping ──────────────────────────────────────────────────────────
interface Variant {
  opt1: string;
  opt2: string;
  opt3: string;
  price: string;
  compareAt: string;
  sku: string;
  variantImage: string;
}

interface ProductGroup {
  handle: string;
  title: string;
  bodyHtml: string;
  productCategory: string;
  tags: string;
  published: boolean;
  status: string;
  seoTitle: string;
  seoDescription: string;
  opt1Name: string;
  opt2Name: string;
  opt3Name: string;
  images: Array<{ src: string; pos: number }>;
  variants: Variant[];
}

function groupCsvRows(rows: string[][]): Map<string, ProductGroup> {
  const map = new Map<string, ProductGroup>();
  const header = rows[0];
  if (!header) return map;

  for (let ri = 1; ri < rows.length; ri++) {
    const row = rows[ri]!;
    const handle = col(row, C.HANDLE);
    if (!handle) continue;

    let g = map.get(handle);
    if (!g) {
      g = {
        handle,
        title:           col(row, C.TITLE),
        bodyHtml:        col(row, C.BODY_HTML),
        productCategory: col(row, C.PRODUCT_CATEGORY),
        tags:            col(row, C.TAGS),
        published:       col(row, C.PUBLISHED) === "true",
        status:          col(row, C.STATUS),
        seoTitle:        col(row, C.SEO_TITLE),
        seoDescription:  col(row, C.SEO_DESCRIPTION),
        opt1Name:        col(row, C.OPT1_NAME),
        opt2Name:        col(row, C.OPT2_NAME),
        opt3Name:        col(row, C.OPT3_NAME),
        images:          [],
        variants:        [],
      };
      map.set(handle, g);
    }

    // Collect images (deduplicate by src)
    const imgSrc = col(row, C.IMAGE_SRC);
    const imgPos = parseInt(col(row, C.IMAGE_POSITION)) || 99;
    if (imgSrc && !g.images.some((i) => i.src === imgSrc)) {
      g.images.push({ src: imgSrc, pos: imgPos });
    }

    // Collect variants
    const opt1Val = col(row, C.OPT1_VALUE);
    if (opt1Val) {
      g.variants.push({
        opt1:         opt1Val,
        opt2:         col(row, C.OPT2_VALUE),
        opt3:         col(row, C.OPT3_VALUE),
        price:        col(row, C.VARIANT_PRICE),
        compareAt:    col(row, C.VARIANT_COMPARE_AT),
        sku:          col(row, C.VARIANT_SKU),
        variantImage: col(row, C.VARIANT_IMAGE),
      });
    }
  }
  return map;
}

// ── Should skip this product ──────────────────────────────────────────────────
function shouldSkip(g: ProductGroup): string | null {
  // Skip non-apparel categories
  for (const prefix of SKIP_CATEGORY_PREFIXES) {
    if (g.productCategory.startsWith(prefix)) return `non-apparel category: ${g.productCategory.slice(0, 40)}`;
  }
  // Skip by handle keywords
  for (const kw of SKIP_HANDLES_CONTAINING) {
    if (g.handle.includes(kw)) return `handle contains "${kw}"`;
  }
  // Skip by title keywords (body armor, energy drinks, protein, etc.)
  const titleLower = g.title.toLowerCase();
  for (const kw of SKIP_TITLE_KEYWORDS) {
    if (titleLower.includes(kw)) return `title contains "${kw}"`;
  }
  // Skip products with no category and no apparel-like title (energy drinks etc.)
  if (!g.productCategory && !titleLower.includes("tee") && !titleLower.includes("hat")
    && !titleLower.includes("shorts") && !titleLower.includes("hoodie")
    && !titleLower.includes("bag") && !titleLower.includes("sock")
    && !titleLower.includes("sweats") && !titleLower.includes("legging")
    && !titleLower.includes("bra") && !titleLower.includes("singlet")
    && !titleLower.includes("jacket") && !titleLower.includes("crewneck")) {
    return "no product category and doesn't look like apparel";
  }
  // Skip services
  if (g.productCategory.startsWith("Services")) return "service product";
  // Skip uncategorized non-apparel
  if ((g.productCategory === "Uncategorized" || g.productCategory === "") &&
      (g.tags.toLowerCase().includes("drop-in") || g.tags.toLowerCase().includes("membership"))) {
    return "service/drop-in";
  }
  return null;
}

// ── Category detection ────────────────────────────────────────────────────────
// Returns WooCommerce category slug
function detectCategory(g: ProductGroup): string {
  const h = g.handle.toLowerCase();
  const t = g.title.toLowerCase();
  const cat = g.productCategory.toLowerCase();
  const tags = g.tags.toLowerCase();

  if (cat.includes("baseball caps") || cat.includes("hats") || t.includes("hat") || t.includes("cap") || tags.includes("type:caps")) return "caps";
  if (cat.includes("hoodies") || t.includes("hoodie") || tags.includes("type:hoodie")) return "hoodies";
  if (cat.includes("sweatpants") || t.includes("sweatpant") || t.includes("jogger") || tags.includes("type:sweatpants")) return "bottoms";
  if (cat.includes("tank tops") || h.includes("cut-off") || tags.includes("sleeveless")) return "activewear";
  if (cat.includes("socks") || t.includes("sock")) return "accessories";
  if (cat.includes("handbag") || cat.includes("tote") || cat.includes("duffel") || t.includes("bag") || t.includes("lanyard")) return "accessories";
  if (t.includes("shorts") || h.includes("shorts") || tags.includes("type:shorts")) return "bottoms";
  if (cat.includes("activewear") || tags.includes("type:activewear")) return "activewear";
  if (cat.includes("outerwear") || t.includes("jacket")) return "activewear";
  // Default tees
  return "tees";
}

// ── Tag cleaning ──────────────────────────────────────────────────────────────
function parseTags(raw: string): Array<{ name: string }> {
  if (!raw.trim()) return [];
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter((t) => {
      if (!t) return false;
      // Skip Shopify system tags and Google fields
      const lower = t.toLowerCase();
      if (lower.startsWith("bundle:")) return false;
      if (lower.startsWith("access:")) return false;
      if (lower.startsWith("google")) return false;
      if (lower.startsWith("gid://")) return false;
      if (lower.startsWith("product.metafields")) return false;
      return true;
    })
    .map((t) => {
      // Clean prefixes to readable labels
      return t
        .replace(/^collection:\s*/i, "")
        .replace(/^drop:\s*/i, "")
        .replace(/^fit:\s*/i, "")
        .replace(/^gender:\s*/i, "")
        .replace(/^type:\s*/i, "")
        .replace(/^style:\s*/i, "")
        .replace(/^limited:\s*/i, "")
        .replace(/^new:\s*/i, "")
        .trim();
    })
    .filter((t) => t.length > 0 && t !== "true" && t !== "false")
    .filter((t, i, arr) => arr.indexOf(t) === i) // dedupe
    .map((name) => ({ name }));
}

// ── Size normalizer ───────────────────────────────────────────────────────────
function normalizeSize(s: string): string {
  const map: Record<string, string> = {
    s: "S", m: "M", l: "L", xl: "XL", xxl: "2XL", "2xl": "2XL",
    "one-size": "One Size", default: s.toUpperCase(),
  };
  return map[s.toLowerCase()] ?? s.toUpperCase();
}

// ── Is this a simple product (no real variations)? ───────────────────────────
function isSimple(g: ProductGroup): boolean {
  if (g.variants.length === 0) return true;
  if (g.variants.length === 1 && g.variants[0]?.opt1.toLowerCase() === "default title") return true;
  if (!g.opt1Name || g.opt1Name.toLowerCase() === "title") return true;
  return false;
}

// ── Build WooCommerce attribute list ─────────────────────────────────────────
interface WooAttr {
  name: string;
  position: number;
  visible: boolean;
  variation: boolean;
  options: string[];
}

function buildAttributes(g: ProductGroup): WooAttr[] {
  const attrs: WooAttr[] = [];

  const addAttr = (name: string, position: number, rawValues: string[]) => {
    const isSize = name.toLowerCase() === "size";
    const options = [...new Set(rawValues.filter(Boolean).map((v) => isSize ? normalizeSize(v) : v))];
    if (options.length === 0) return;
    attrs.push({ name, position, visible: true, variation: true, options });
  };

  if (g.opt1Name && g.opt1Name.toLowerCase() !== "title") {
    addAttr(g.opt1Name, 0, g.variants.map((v) => v.opt1));
  }
  if (g.opt2Name) {
    addAttr(g.opt2Name, 1, g.variants.map((v) => v.opt2));
  }
  // opt3: if it looks like it's a design name embedded in the name field (beast mode edge case), skip
  if (g.opt3Name && g.opt3Name.length > 2 && !g.opt3Name.startsWith("product.")) {
    // Only add if it's a real attribute, not a weird Shopify 3-way encoding
    const opt3Values = g.variants.map((v) => v.opt3).filter(Boolean);
    if (opt3Values.length > 0) {
      addAttr(g.opt3Name, 2, opt3Values);
    }
  }

  return attrs;
}

// ── Categories cache ──────────────────────────────────────────────────────────
const WOOCOMMERCE_CATEGORIES = [
  { name: "Tees",        slug: "tees",        description: "Heavyweight graphic tees. Limited drops." },
  { name: "Hoodies",     slug: "hoodies",     description: "Premium hoodies and crewnecks." },
  { name: "Caps",        slug: "caps",        description: "5-panel caps and headwear." },
  { name: "Bottoms",     slug: "bottoms",     description: "Shorts, sweatpants, joggers." },
  { name: "Activewear",  slug: "activewear",  description: "Tank tops, cut-offs, performance tees." },
  { name: "Accessories", slug: "accessories", description: "Bags, socks, and accessories." },
];

async function ensureCategories(): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  console.log("\n📂  Setting up WooCommerce categories…");

  for (const def of WOOCOMMERCE_CATEGORIES) {
    if (DRY_RUN) {
      map.set(def.slug, 0);
      console.log(`  [DRY] Would ensure category "${def.name}"`);
      continue;
    }

    const existing = await wooGet<WooCategory[]>(
      `products/categories?slug=${def.slug}&hide_empty=false`
    );
    if (existing.length > 0 && existing[0]) {
      map.set(def.slug, existing[0].id);
      console.log(`  ✓  "${def.name}" (ID ${existing[0].id})`);
    } else {
      const created = await wooPost<WooCategory>("products/categories", {
        name: def.name,
        slug: def.slug,
        description: def.description,
      });
      map.set(def.slug, created.id);
      console.log(`  ✚  Created "${def.name}" (ID ${created.id})`);
    }
  }

  return map;
}

// ── Prefetch all existing product slugs (one paginated pass) ─────────────────
async function fetchExistingSlugs(): Promise<Set<string>> {
  const slugs = new Set<string>();
  let page = 1;
  while (true) {
    const products = await wooGet<WooProduct[]>(`products?per_page=100&status=any&page=${page}`);
    if (!products.length) break;
    products.forEach((p) => slugs.add(p.slug));
    if (products.length < 100) break;
    page++;
  }
  return slugs;
}

// ── Check if product already exists ──────────────────────────────────────────
async function getExistingId(slug: string): Promise<number | null> {
  if (DRY_RUN) return null;
  const results = await wooGet<WooProduct[]>(`products?slug=${slug}&status=any`);
  return results.length > 0 && results[0] ? results[0].id : null;
}

// ── Create a product (and its variations) ────────────────────────────────────
async function createProduct(
  g: ProductGroup,
  catMap: Map<string, number>
): Promise<void> {
  const simple = isSimple(g);

  // Determine publish status
  const isOnlinePublished = g.published && g.status === "active" && !g.tags.toLowerCase().includes("access:offline");
  const wooStatus = isOnlinePublished ? "publish" : "draft";

  // Category
  const catSlug = detectCategory(g);
  const catId   = catMap.get(catSlug) ?? 0;

  // Images sorted by position
  const images = g.images
    .sort((a, b) => a.pos - b.pos)
    .map((img) => ({ src: img.src }));

  // Tags
  const tags = parseTags(g.tags);

  const productBody: Record<string, unknown> = {
    name:              g.title,
    slug:              g.handle,
    type:              simple ? "simple" : "variable",
    status:            wooStatus,
    description:       g.bodyHtml,
    short_description: g.seoDescription || "",
    categories:        catId ? [{ id: catId }] : [],
    tags,
    images,
    meta_data: [
      { key: "_seo_title",       value: g.seoTitle },
      { key: "_seo_description", value: g.seoDescription },
      { key: "_shopify_handle",  value: g.handle },
    ],
  };

  // Simple: add price + stock directly
  if (simple) {
    const v = g.variants[0];
    if (v) {
      const hasCompare = v.compareAt && v.compareAt !== "" && v.compareAt !== v.price;
      productBody.regular_price = hasCompare ? v.compareAt : v.price;
      if (hasCompare) productBody.sale_price = v.price;
      productBody.manage_stock    = true;
      productBody.stock_quantity  = DEFAULT_STOCK;
      productBody.stock_status    = "instock";
      if (v.sku) productBody.sku = v.sku;
    }
  } else {
    // Variable: add attributes
    productBody.attributes = buildAttributes(g);
  }

  const label = `[${wooStatus.toUpperCase()}] ${simple ? "simple" : "variable"} "${g.title}"`;

  if (DRY_RUN) {
    console.log(`  [DRY] Would create ${label}`);
    if (!simple) {
      console.log(`        ${g.variants.length} variants, attrs: ${(productBody.attributes as WooAttr[]).map((a) => a.name + "(" + a.options.length + ")").join(", ")}`);
    }
    return;
  }

  const created = await wooPost<WooProduct>("products", productBody);
  console.log(`  ✚  ${label} → ID ${created.id}`);

  // Create variations — batch all at once (single API call)
  if (!simple) {
    const varBodies = g.variants.map((v) => {
      const varAttrs: Array<{ name: string; option: string }> = [];
      if (g.opt1Name && v.opt1) {
        const isSize = g.opt1Name.toLowerCase() === "size";
        varAttrs.push({ name: g.opt1Name, option: isSize ? normalizeSize(v.opt1) : v.opt1 });
      }
      if (g.opt2Name && v.opt2) {
        const isSize = g.opt2Name.toLowerCase() === "size";
        varAttrs.push({ name: g.opt2Name, option: isSize ? normalizeSize(v.opt2) : v.opt2 });
      }
      if (g.opt3Name && v.opt3 && g.opt3Name.length > 2) {
        varAttrs.push({ name: g.opt3Name, option: v.opt3 });
      }
      const hasCompare = v.compareAt && v.compareAt !== "" && v.compareAt !== v.price;
      const vb: Record<string, unknown> = {
        attributes:     varAttrs,
        regular_price:  hasCompare ? v.compareAt : v.price,
        manage_stock:   true,
        stock_quantity: DEFAULT_STOCK,
        stock_status:   "instock",
      };
      if (hasCompare) vb.sale_price = v.price;
      if (v.sku)           vb.sku   = v.sku;
      if (v.variantImage)  vb.image = { src: v.variantImage };
      return vb;
    });

    try {
      const batchRes = await wooPost<{ create: { id: number }[] }>(
        `products/${created.id}/variations/batch`,
        { create: varBodies }
      );
      const count = batchRes.create?.length ?? 0;
      console.log(`     └─ ${count}/${g.variants.length} variations created (batch)`);
    } catch (err) {
      console.warn(`     ⚠  Batch variations failed: ${err instanceof Error ? err.message.slice(0, 100) : err}`);
    }
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n╔════════════════════════════════════════════════════╗");
  console.log("║  R1P FITNESS — WooCommerce Product Seeder          ║");
  if (DRY_RUN) {
    console.log("║  ⚡ DRY RUN — no API calls will be made             ║");
  }
  console.log("╚════════════════════════════════════════════════════╝");

  // ── 1. Parse CSV ──────────────────────────────────────────────────────────
  console.log(`\n📄  Reading: ${CSV_PATH}`);
  const content = readFileSync(CSV_PATH, "utf-8");
  const allRows = parseCsv(content);
  const dataRows = allRows.slice(1); // skip header
  const groups   = groupCsvRows(allRows);
  console.log(`    ${groups.size} unique product handles across ${dataRows.length} rows`);

  // ── 2. Categorize what we'll do with each product ────────────────────────
  const toCreate: ProductGroup[] = [];
  const toSkip:   Array<{ handle: string; reason: string }> = [];

  for (const [, g] of groups) {
    const skipReason = shouldSkip(g);
    if (skipReason) {
      toSkip.push({ handle: g.handle, reason: skipReason });
    } else {
      toCreate.push(g);
    }
  }

  console.log(`\n📊  Plan:`);
  console.log(`    ${toCreate.length} apparel products to create (${toCreate.filter((g) => g.published && g.status === "active" && !g.tags.toLowerCase().includes("access:offline")).length} publish, ${toCreate.filter((g) => !(g.published && g.status === "active") || g.tags.toLowerCase().includes("access:offline")).length} draft)`);
  console.log(`    ${toSkip.length} products skipped (non-apparel / services)\n`);

  if (DRY_RUN) {
    console.log("── Skipped products ──────────────────────────────────");
    for (const s of toSkip.slice(0, 15)) {
      console.log(`  SKIP  ${s.handle.slice(0, 45).padEnd(45)} | ${s.reason}`);
    }
    if (toSkip.length > 15) console.log(`  ... and ${toSkip.length - 15} more`);
  }

  // ── 3. Ensure categories ─────────────────────────────────────────────────
  const catMap = await ensureCategories();

  // ── 4. Prefetch existing slugs (one pass, avoids N extra GET calls) ───────
  let existingSlugs = new Set<string>();
  if (!DRY_RUN) {
    process.stdout.write("\n🔍  Fetching existing product slugs… ");
    existingSlugs = await fetchExistingSlugs();
    console.log(`${existingSlugs.size} found`);
  }

  // ── 5. Seed products ─────────────────────────────────────────────────────
  console.log("\n📦  Seeding products…");
  let created = 0, skipped = 0, failed = 0;

  for (const g of toCreate) {
    try {
      if (!DRY_RUN && existingSlugs.has(g.handle)) {
        console.log(`  ⏭   "${g.title.slice(0, 50)}" — already exists`);
        skipped++;
        continue;
      }

      await createProduct(g, catMap);
      created++;

      // Small throttle between products
      if (!DRY_RUN) await delay(300);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ❌  "${g.handle}": ${msg.slice(0, 120)}`);
      failed++;
      if (!DRY_RUN) await delay(800);
    }
  }

  // ── 6. Summary ───────────────────────────────────────────────────────────
  console.log("\n╔════════════════════════════════════════════════════╗");
  console.log(`║  Done!  Created: ${String(created).padEnd(4)} Skipped: ${String(skipped).padEnd(4)} Failed: ${String(failed).padEnd(4)}  ║`);
  console.log("╚════════════════════════════════════════════════════╝\n");

  if (failed > 0) process.exit(1);
}

main().catch((err: unknown) => {
  console.error("Fatal:", err);
  process.exit(1);
});
