import "server-only";

import { storeFetch } from "./client";
import { WooError } from "./errors";
import {
  mapProduct,
  mapProductSummary,
  mapVariation,
  type RawStoreProduct,
  type RawStoreVariation,
} from "./mappers";
import type {
  Product,
  ProductCategory,
  ProductSummary,
  ProductVariation,
} from "./types";

/**
 * WooCommerce Store API — product read path.
 *
 * Only server-callable. Thin translation layer between Store API shapes and
 * our domain types. No business logic here — sorting, search, and filtering
 * beyond what Woo natively supports happens in the catalog adapter.
 *
 * Every function:
 *  - Uses Next.js `fetch` cache with explicit tags for on-demand revalidation.
 *  - Defaults to 5-minute revalidation windows — product listings change
 *    rarely, and the webhook handler clears tags for instant updates.
 *  - Maps raw → domain via `lib/woo/mappers`.
 */

const DEFAULT_REVALIDATE_SECONDS = 300;

export const WOO_TAGS = {
  products: "woo:products",
  product: (id: string) => `woo:product:${id}`,
  productBySlug: (slug: string) => `woo:product:slug:${slug}`,
  variations: (productId: string) => `woo:product:${productId}:variations`,
  categories: "woo:categories",
  category: (slug: string) => `woo:category:${slug}`,
} as const;

/** Store API orderby values we actually use. */
type StoreOrderBy = "date" | "price" | "popularity" | "menu_order";
type StoreOrder = "asc" | "desc";

export interface StoreListProductsParams {
  /** Category slug. Translated to Woo's `category` (which accepts slugs). */
  categorySlug?: string;
  /** Free-text search. */
  search?: string;
  /** 1-based page. */
  page?: number;
  /** Items per page. Woo cap is 100; we cap at 48 for safety. */
  perPage?: number;
  orderby?: StoreOrderBy;
  order?: StoreOrder;
}

export interface StoreListProductsResult {
  items: ProductSummary[];
  total: number;
  totalPages: number;
  page: number;
  perPage: number;
}

/**
 * Shape returned by Next's `fetch` augmentation when we need headers.
 * The `storeFetch` helper returns JSON; here we use the bare `fetch` against
 * the same base URL because we need pagination headers (`X-WP-Total`,
 * `X-WP-TotalPages`).
 */
async function storeFetchWithHeaders<T>(
  path: string,
  init: {
    searchParams?: Record<string, string | number | undefined>;
    tags?: string[];
    revalidate?: number;
  },
): Promise<{ data: T; headers: Headers }> {
  const base = (process.env.WOO_BASE_URL ?? "").replace(/\/$/, "");
  if (!base) {
    throw new WooError({
      code: "WOO_UNREACHABLE",
      message: "WOO_BASE_URL is not configured",
      status: 500,
    });
  }
  const url = new URL(`${base}/wp-json/wc/store/v1${path}`);
  for (const [k, v] of Object.entries(init.searchParams ?? {})) {
    if (v === undefined || v === null || v === "") continue;
    url.searchParams.set(k, String(v));
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5_000);
  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
      next: {
        revalidate: init.revalidate ?? DEFAULT_REVALIDATE_SECONDS,
        tags: init.tags,
      },
    });
    if (!res.ok) {
      throw new WooError({
        code: res.status === 404 ? "NOT_FOUND" : "WOO_UNREACHABLE",
        message: `Woo request failed: ${res.status} ${res.statusText}`,
        status: res.status,
      });
    }
    const data = (await res.json()) as T;
    return { data, headers: res.headers };
  } catch (err) {
    if (err instanceof WooError) throw err;
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new WooError({
        code: "WOO_TIMEOUT",
        message: "Woo request timed out",
        status: 504,
        cause: err,
      });
    }
    throw new WooError({
      code: "WOO_UNREACHABLE",
      message: "Woo request failed before a response was received",
      status: 502,
      cause: err,
    });
  } finally {
    clearTimeout(timer);
  }
}

function parsePositiveInt(input: string | null, fallback: number): number {
  if (!input) return fallback;
  const n = Number.parseInt(input, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function clampPerPage(n: number | undefined): number {
  if (!n || n <= 0) return 12;
  if (n > 48) return 48;
  return Math.floor(n);
}

/**
 * List products for a storefront grid. Returns lightweight summaries —
 * callers needing full product data should use `getStoreProductBySlug`.
 */
export async function listStoreProducts(
  params: StoreListProductsParams = {},
): Promise<StoreListProductsResult> {
  const perPage = clampPerPage(params.perPage);
  const page = params.page && params.page > 0 ? Math.floor(params.page) : 1;

  const tags: string[] = [WOO_TAGS.products];
  if (params.categorySlug) tags.push(WOO_TAGS.category(params.categorySlug));

  const { data, headers } = await storeFetchWithHeaders<RawStoreProduct[]>("/products", {
    searchParams: {
      page,
      per_page: perPage,
      category: params.categorySlug,
      search: params.search,
      orderby: params.orderby,
      order: params.order,
    },
    tags,
  });

  const total = parsePositiveInt(headers.get("x-wp-total"), data.length);
  const totalPages = parsePositiveInt(headers.get("x-wp-totalpages"), 1);

  return {
    items: data.map(mapProductSummary),
    total,
    totalPages,
    page,
    perPage,
  };
}

/**
 * Fetch a single product by slug. Uses the Store API `slug=` filter because
 * Store API has no `/products/by-slug/{slug}` endpoint.
 */
export async function getStoreProductBySlug(slug: string): Promise<Product | null> {
  if (!slug) return null;

  const { data } = await storeFetchWithHeaders<RawStoreProduct[]>("/products", {
    searchParams: { slug, per_page: 1 },
    tags: [WOO_TAGS.productBySlug(slug)],
  });

  const raw = data[0];
  if (!raw) return null;

  const base = mapProduct(raw);

  // Attach variations if this is a variable product.
  if (raw.variations && raw.variations.length > 0) {
    const variations = await getStoreVariations(String(raw.id));
    return { ...base, variations };
  }

  return base;
}

/**
 * List variations for a variable product. Store API does not include full
 * variation data on the product response — we fetch it separately.
 */
export async function getStoreVariations(productId: string): Promise<ProductVariation[]> {
  if (!productId) return [];
  const { data } = await storeFetchWithHeaders<RawStoreVariation[]>(
    `/products/${encodeURIComponent(productId)}/variations`,
    {
      searchParams: { per_page: 100 },
      tags: [WOO_TAGS.variations(productId)],
    },
  );
  return data.map(mapVariation);
}

interface RawStoreCategory {
  id: number;
  name: string;
  slug: string;
  parent?: number;
  count?: number;
}

export async function listStoreCategories(): Promise<ProductCategory[]> {
  const { data } = await storeFetchWithHeaders<RawStoreCategory[]>("/products/categories", {
    searchParams: { per_page: 100, hide_empty: "true" },
    tags: [WOO_TAGS.categories],
  });
  return data.map((c) => ({ id: String(c.id), name: c.name, slug: c.slug }));
}

export async function getStoreCategoryBySlug(slug: string): Promise<ProductCategory | null> {
  if (!slug) return null;
  const { data } = await storeFetchWithHeaders<RawStoreCategory[]>("/products/categories", {
    searchParams: { slug, per_page: 1 },
    tags: [WOO_TAGS.category(slug)],
  });
  const raw = data[0];
  if (!raw) return null;
  return { id: String(raw.id), name: raw.name, slug: raw.slug };
}

// storeFetch is re-exported for downstream modules (cart, checkout) that need
// the non-paginated helper. Kept here so the products module stays the single
// source of truth for Store API endpoints.
export { storeFetch };
