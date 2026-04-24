import "server-only";

import type { Settings } from "meilisearch";
import { Meilisearch } from "meilisearch";
import type { ProductSummary } from "@/lib/woo/types";

/**
 * Meilisearch integration — server-only.
 *
 * Two client types:
 *  - `getMeiliAdmin()` — master-key client for indexing. Used by the reindex
 *    script and the Woo product webhook handler. Never called from HTTP routes
 *    that serve user requests.
 *  - `getMeiliSearch()` — search-only key client. Used by `/api/search`.
 *    Safe to share the key in `NEXT_PUBLIC_MEILI_SEARCH_KEY` for browser-side
 *    queries if you ever want to add client-side search.
 *
 * Index: `products_v1`
 *
 * Index settings (applied once by `scripts/configure-meili.ts`):
 *   searchableAttributes: ['name', 'description', 'shortDescription', 'categories', 'tags']
 *   filterableAttributes: ['categorySlugs', 'sizeOptions', 'colorOptions', 'inStock', 'priceCents', 'isLimited']
 *   sortableAttributes:   ['priceCents', 'isLimited', 'publishedAt']
 */

export const MEILI_INDEX = "products_v1";

/** Flat document shape stored in Meilisearch. */
export interface MeiliProduct {
  /** Woo product id (string). Primary key in Meili. */
  id: string;
  slug: string;
  name: string;
  description: string;
  shortDescription: string;
  /** All category names, e.g. ["Tees", "Hoodies"]. Used for full-text search. */
  categories: string[];
  /** Category slugs — used for filtering. */
  categorySlugs: string[];
  tags: string[];
  /** Price in cents — used for sorting and range filtering. */
  priceCents: number;
  compareAtPriceCents?: number;
  /** Size options from the pa_size attribute, e.g. ["S","M","L","XL"]. */
  sizeOptions: string[];
  /** Color options from the pa_color attribute, e.g. ["Black","Bone"]. */
  colorOptions: string[];
  /** true when stockStatus is in_stock or low_stock. */
  inStock: boolean;
  /** Propagated from ProductMeta.isLimited. */
  isLimited: boolean;
  /** ISO 8601 string — used for sorting by newest. */
  publishedAt?: string;
  /** Thumbnail URL for search modal display. */
  imageUrl?: string;
  imageAlt?: string;
}

function requireMeiliHost(): string {
  const host = process.env.MEILI_HOST;
  if (!host) throw new Error("MEILI_HOST env var is not set");
  return host;
}

/** Admin client — used for indexing only. Requires MEILI_MASTER_KEY. */
export function getMeiliAdmin(): Meilisearch {
  return new Meilisearch({
    host: requireMeiliHost(),
    apiKey: process.env.MEILI_MASTER_KEY ?? "",
  });
}

/** Search client — used for query requests. Requires MEILI_SEARCH_KEY (read-only). */
export function getMeiliSearch(): Meilisearch {
  return new Meilisearch({
    host: requireMeiliHost(),
    apiKey:
      process.env.MEILI_SEARCH_KEY ??
      process.env.NEXT_PUBLIC_MEILI_SEARCH_KEY ??
      process.env.MEILI_MASTER_KEY ??
      "",
  });
}

/** True when all required Meilisearch env vars are present. */
export function isMeiliConfigured(): boolean {
  return Boolean(process.env.MEILI_HOST) && Boolean(
    process.env.MEILI_SEARCH_KEY ??
    process.env.NEXT_PUBLIC_MEILI_SEARCH_KEY ??
    process.env.MEILI_MASTER_KEY,
  );
}

// ── Recommended index settings ────────────────────────────────────────────
// Apply once via `pnpm tsx scripts/configure-meili.ts`.

export const MEILI_INDEX_SETTINGS: Settings = {
  searchableAttributes: [
    "name",
    "description",
    "shortDescription",
    "categories",
    "tags",
  ],
  filterableAttributes: [
    "categorySlugs",
    "sizeOptions",
    "colorOptions",
    "inStock",
    "priceCents",
    "isLimited",
  ],
  sortableAttributes: ["priceCents", "isLimited", "publishedAt"],
  typoTolerance: {
    enabled: true,
    minWordSizeForTypos: { oneTypo: 4, twoTypos: 8 },
  },
  pagination: { maxTotalHits: 1000 },
} as const;

// ── Domain → Meili document mapper ────────────────────────────────────────

import type { Product } from "@/lib/woo/types";

export function productToMeiliDocument(p: Product): MeiliProduct {
  const sizeAttr = p.attributes.find((a) => a.id === "pa_size");
  const colorAttr = p.attributes.find((a) => a.id === "pa_color");

  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    shortDescription: p.shortDescription,
    categories: p.categories.map((c) => c.name),
    categorySlugs: p.categories.map((c) => c.slug),
    tags: p.tags,
    priceCents: p.price.amount,
    compareAtPriceCents: p.compareAtPrice?.amount,
    sizeOptions: sizeAttr?.options ?? [],
    colorOptions: colorAttr?.options ?? [],
    inStock: p.stockStatus === "in_stock" || p.stockStatus === "low_stock",
    isLimited: p.meta.isLimited ?? false,
    publishedAt: p.meta.dropDate,
    imageUrl: p.images[0]?.url,
    imageAlt: p.images[0]?.alt,
  };
}

/** Map a Meili document back to a ProductSummary for the search modal. */
export function meiliDocumentToSummary(doc: MeiliProduct): ProductSummary {
  return {
    id: doc.id,
    slug: doc.slug,
    name: doc.name,
    price: { amount: doc.priceCents, currency: "USD" },
    compareAtPrice: doc.compareAtPriceCents
      ? { amount: doc.compareAtPriceCents, currency: "USD" }
      : undefined,
    image: doc.imageUrl
      ? { id: doc.id, url: doc.imageUrl, alt: doc.imageAlt ?? "" }
      : undefined,
    stockStatus: doc.inStock ? "in_stock" : "out_of_stock",
    isLimited: doc.isLimited,
    sizeOptions: doc.sizeOptions,
    colorOptions: doc.colorOptions,
  };
}

// ── Index write helpers ────────────────────────────────────────────────────

/**
 * Upsert a single product into the Meilisearch index.
 * Fire-and-forget pattern — call from the Woo product webhook.
 */
export async function upsertProductInMeili(product: Product): Promise<void> {
  const doc = productToMeiliDocument(product);
  const client = getMeiliAdmin();
  const index = client.index(MEILI_INDEX);
  await index.addDocuments([doc], { primaryKey: "id" });
}

/**
 * Delete a product from the Meilisearch index by id.
 * Called from the Woo product webhook on `product.deleted`.
 */
export async function deleteProductFromMeili(productId: string): Promise<void> {
  const client = getMeiliAdmin();
  const index = client.index(MEILI_INDEX);
  await index.deleteDocument(productId);
}
