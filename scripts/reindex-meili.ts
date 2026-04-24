#!/usr/bin/env tsx
/**
 * scripts/reindex-meili.ts
 *
 * Full product reindex: fetches all products directly from the WooCommerce
 * REST API v3 and bulk-pushes them to Meilisearch.
 *
 * Intentionally does NOT import server-only modules (lib/woo/products.ts,
 * lib/catalog/woo-adapter.ts) — those use `import "server-only"` which
 * throws outside the Next.js runtime.
 *
 * Run:
 *   pnpm tsx scripts/reindex-meili.ts
 *   # Clean rebuild:
 *   pnpm tsx scripts/reindex-meili.ts --clear
 *
 * Options:
 *   --clear    Delete all existing documents before re-indexing.
 *
 * Requires:
 *   WOO_BASE_URL, WOO_CONSUMER_KEY, WOO_CONSUMER_SECRET (Woo REST API v3)
 *   MEILI_HOST, MEILI_MASTER_KEY
 */

import "dotenv/config";
import { getMeiliAdmin, MEILI_INDEX, productToMeiliDocument } from "../lib/search/meilisearch";
import type { MeiliProduct } from "../lib/search/meilisearch";
import type { Product, ProductVariation } from "../lib/woo/types";

const BATCH_SIZE = 100;

// ── Minimal Woo REST v3 types ─────────────────────────────────────────────

interface RawWooAttribute {
  id: number;
  name: string;
  options: string[];
  variation: boolean;
}

interface RawWooImage {
  id: number;
  src: string;
  alt: string;
}

interface RawWooProduct {
  id: number;
  slug: string;
  name: string;
  description: string;
  short_description: string;
  price: string;
  regular_price: string;
  status: string;
  stock_status: "instock" | "outofstock" | "onbackorder";
  categories: Array<{ id: number; name: string; slug: string }>;
  tags: Array<{ id: number; name: string; slug: string }>;
  images: RawWooImage[];
  attributes: RawWooAttribute[];
  type: "simple" | "variable" | "grouped" | "external";
  date_created: string;
}

interface RawWooVariation {
  id: number;
  price: string;
  regular_price: string;
  stock_status: "instock" | "outofstock" | "onbackorder";
  attributes: Array<{ id: number; name: string; option: string }>;
}

// ── Woo REST API fetch helper ─────────────────────────────────────────────

const wooBase = process.env.WOO_BASE_URL?.replace(/\/$/, "") ?? "";
const wooKey = process.env.WOO_CONSUMER_KEY ?? "";
const wooSecret = process.env.WOO_CONSUMER_SECRET ?? "";

async function wooFetch<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  const url = new URL(`${wooBase}/wp-json/wc/v3${path}`);
  url.username = wooKey;
  url.password = wooSecret;
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Woo API ${path} → ${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

// ── Conversion helpers ────────────────────────────────────────────────────

function dollarToMinor(price: string): number {
  return Math.round(parseFloat(price || "0") * 100);
}

function mapProduct(raw: RawWooProduct, variations: ProductVariation[] = []): Product {
  const priceCents = dollarToMinor(raw.price);
  const regularCents = dollarToMinor(raw.regular_price);
  const hasDiscount = regularCents > 0 && priceCents < regularCents;
  const stockStatus: "in_stock" | "out_of_stock" | "low_stock" =
    raw.stock_status === "instock" ? "in_stock" : "out_of_stock";

  return {
    id: String(raw.id),
    slug: raw.slug,
    name: raw.name,
    description: raw.description,
    shortDescription: raw.short_description,
    price: { amount: priceCents, currency: "USD" },
    compareAtPrice: hasDiscount ? { amount: regularCents, currency: "USD" } : undefined,
    categories: raw.categories.map((c) => ({ id: String(c.id), name: c.name, slug: c.slug })),
    tags: raw.tags.map((t) => t.name),
    stockStatus,
    attributes: raw.attributes.map((a) => ({
      id: String(a.id),
      name: a.name,
      options: a.options,
      variation: a.variation,
      visible: true,
    })),
    variations,
    images: raw.images.map((img) => ({ id: String(img.id), url: img.src, alt: img.alt })),
    meta: { isLimited: false },
    seo: { title: raw.name, description: "" },
  };
}

function mapVariation(raw: RawWooVariation): ProductVariation {
  const priceCents = dollarToMinor(raw.price);
  // Build attributes as Record<string, string> — keyed by attribute name slug.
  const attributes: Record<string, string> = {};
  for (const a of raw.attributes) {
    attributes[a.name] = a.option;
  }
  return {
    id: String(raw.id),
    sku: "",
    price: { amount: priceCents, currency: "USD" },
    stockStatus: raw.stock_status === "instock" ? "in_stock" : "out_of_stock",
    attributes,
  };
}

// ── Fetching ──────────────────────────────────────────────────────────────

async function fetchAllProducts(): Promise<Product[]> {
  console.log("Fetching products from WooCommerce REST API v3...");
  const products: Product[] = [];
  let page = 1;
  let fetched = 0;

  do {
    const rawList = await wooFetch<RawWooProduct[]>("/products", {
      per_page: 48,
      page,
      status: "publish",
      orderby: "date",
      order: "desc",
    });

    if (rawList.length === 0) break;

    for (const raw of rawList) {
      let variations: ProductVariation[] = [];
      if (raw.type === "variable") {
        try {
          const rawVars = await wooFetch<RawWooVariation[]>(`/products/${raw.id}/variations`, {
            per_page: 100,
          });
          variations = rawVars.map(mapVariation);
        } catch (err) {
          console.warn(`  ⚠ Could not fetch variations for ${raw.slug}:`, err);
        }
      }
      products.push(mapProduct(raw, variations));
    }

    fetched += rawList.length;
    console.log(`  Page ${page}: +${rawList.length} products (${fetched} total)`);

    if (rawList.length < 48) break;
    page++;
  } while (true);

  return products;
}

async function main() {
  const shouldClear = process.argv.includes("--clear");

  if (!process.env.MEILI_HOST || !process.env.MEILI_MASTER_KEY) {
    console.error("MEILI_HOST and MEILI_MASTER_KEY must be set");
    process.exit(1);
  }

  if (!wooBase || !wooKey || !wooSecret) {
    console.error("WOO_BASE_URL, WOO_CONSUMER_KEY, and WOO_CONSUMER_SECRET must be set");
    process.exit(1);
  }

  const client = getMeiliAdmin();
  const index = client.index(MEILI_INDEX);

  if (shouldClear) {
    console.log("Clearing existing index documents...");
    const task = await index.deleteAllDocuments();
    await client.tasks.waitForTask(task.taskUid, { timeout: 30_000 });
    console.log("  ✓ Index cleared");
  }

  const products = await fetchAllProducts();
  const documents: MeiliProduct[] = products.map(productToMeiliDocument);

  console.log(`\nIndexing ${documents.length} documents in batches of ${BATCH_SIZE}...`);
  for (let i = 0; i < documents.length; i += BATCH_SIZE) {
    const batch = documents.slice(i, i + BATCH_SIZE);
    const task = await index.addDocuments(batch, { primaryKey: "id" });
    await client.tasks.waitForTask(task.taskUid, { timeout: 60_000 });
    console.log(`  ✓ Batch ${Math.floor(i / BATCH_SIZE) + 1}: indexed ${batch.length} documents`);
  }

  const stats = await index.getStats();
  console.log(`\nDone. Index now contains ${stats.numberOfDocuments} documents.`);
}

main().catch((err) => {
  console.error("reindex-meili failed:", err);
  process.exit(1);
});
