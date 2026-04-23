/**
 * scripts/seed/woo.ts
 *
 * WooCommerce REST client + idempotent setup primitives.
 *
 * Exports:
 *   - `createWooClient` — fetch-based client with retry + jitter
 *   - `ensureGlobalAttributes` — creates pa_size, pa_color, …
 *   - `ensureAttributeTerms`   — creates terms with menu_order + color swatch meta
 *   - `ensureCategoryTree`     — creates the full tree; parent-before-child
 *   - `findProductBySlug`      — idempotent "is this slug already up?"
 *   - `createProduct`          — POST /products with variations batch
 */

import {
  MAX_CONCURRENCY,
  MAX_RETRIES,
  REQUEST_TIMEOUT_MS,
  PRODUCT_CREATE_TIMEOUT_MS,
  RETRY_BACKOFF_BASE_MS,
  GLOBAL_ATTRIBUTES,
  CATEGORY_TREE,
} from "./config.ts";
import type { PlannedProduct } from "./types.ts";

// ── Public types ──────────────────────────────────────────────────────────────
export interface RequestOpts {
  /** Per-request timeout override. Default: REQUEST_TIMEOUT_MS */
  timeoutMs?: number;
  /** When true, do NOT retry on abort/timeout (side effect may have taken). */
  noRetryOnTimeout?: boolean;
}
export interface WooClient {
  get<T>(path: string, opts?: RequestOpts): Promise<T>;
  post<T>(path: string, body: unknown, opts?: RequestOpts): Promise<T>;
  put<T>(path: string, body: unknown, opts?: RequestOpts): Promise<T>;
  del<T>(path: string, opts?: RequestOpts): Promise<T>;
}

interface WooAttrRes      { id: number; slug: string; name: string }
interface WooTermRes      { id: number; slug: string; name: string; menu_order: number }
interface WooCategoryRes  { id: number; slug: string; name: string; parent: number }
interface WooProductRes   { id: number; slug: string; name: string; status: string }

// ── Concurrency limiter ───────────────────────────────────────────────────────
class Limiter {
  private active = 0;
  private queue: Array<() => void> = [];
  constructor(private readonly max: number) {}
  async run<T>(fn: () => Promise<T>): Promise<T> {
    if (this.active >= this.max) await new Promise<void>((res) => this.queue.push(res));
    this.active++;
    try { return await fn(); }
    finally {
      this.active--;
      const next = this.queue.shift();
      if (next) next();
    }
  }
}

// ── Client factory ────────────────────────────────────────────────────────────
export function createWooClient(baseUrl: string, key: string, secret: string): WooClient {
  const AUTH = "Basic " + Buffer.from(`${key}:${secret}`).toString("base64");
  const limiter = new Limiter(MAX_CONCURRENCY);

  async function request<T>(method: string, path: string, body?: unknown, opts?: RequestOpts): Promise<T> {
    const url = `${baseUrl.replace(/\/$/, "")}/wp-json/wc/v3/${path}`;
    const timeoutMs = opts?.timeoutMs ?? REQUEST_TIMEOUT_MS;
    let lastErr: unknown;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      let timedOut = false;
      try {
        return await limiter.run(async () => {
          const ctrl = new AbortController();
          const timer = setTimeout(() => { timedOut = true; ctrl.abort(); }, timeoutMs);
          try {
            const res = await fetch(url, {
              method,
              headers: {
                Authorization: AUTH,
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              body: body !== undefined ? JSON.stringify(body) : undefined,
              signal: ctrl.signal,
            });
            if (!res.ok) {
              const text = await res.text().catch(() => "");
              throw new HttpError(method, path, res.status, text);
            }
            const txt = await res.text();
            return (txt ? JSON.parse(txt) : (undefined as unknown)) as T;
          } finally {
            clearTimeout(timer);
          }
        });
      } catch (err) {
        lastErr = err;
        const isHttp = err instanceof HttpError;
        // Timeout: don't retry if caller opted in (side effect may have landed)
        if (timedOut && opts?.noRetryOnTimeout) throw new TimeoutError(method, path, timeoutMs);
        const retryable = !isHttp
          ? true                                     // network / timeout → retry
          : err.status === 429 || err.status >= 500; // HTTP → retry 429/5xx
        if (!retryable || attempt === MAX_RETRIES) throw err;
        const backoff = RETRY_BACKOFF_BASE_MS * Math.pow(2, attempt) + Math.floor(Math.random() * 400);
        await sleep(backoff);
      }
    }
    throw lastErr;
  }

  return {
    get:  <T,>(p: string, o?: RequestOpts)                 => request<T>("GET", p, undefined, o),
    post: <T,>(p: string, b: unknown, o?: RequestOpts)     => request<T>("POST", p, b, o),
    put:  <T,>(p: string, b: unknown, o?: RequestOpts)     => request<T>("PUT", p, b, o),
    del:  <T,>(p: string, o?: RequestOpts)                 => request<T>("DELETE", p, undefined, o),
  };
}

export class HttpError extends Error {
  constructor(
    public method: string,
    public path: string,
    public status: number,
    public body: string,
  ) {
    super(`${method} ${path} → ${status}: ${body.slice(0, 200)}`);
  }
}

export class TimeoutError extends Error {
  constructor(public method: string, public path: string, public timeoutMs: number) {
    super(`${method} ${path} timed out after ${timeoutMs}ms`);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ──────────────────────────────────────────────────────────────────────────────
// Ensure global attributes
// ──────────────────────────────────────────────────────────────────────────────

export interface AttributeHandle {
  taxonomy: string;               // "pa_size"
  id: number;                     // Woo attribute id
  termIdBySlug: Map<string, number>;
}

export async function ensureGlobalAttributes(client: WooClient): Promise<Map<string, AttributeHandle>> {
  const existing = await client.get<WooAttrRes[]>("products/attributes");
  // Woo GET returns slug already prefixed ("pa_size"); also index the bare slug
  // in case a future Woo version ever changes behavior.
  const bySlug = new Map<string, WooAttrRes>();
  for (const a of existing) {
    bySlug.set(a.slug, a);
    if (!a.slug.startsWith("pa_")) bySlug.set(`pa_${a.slug}`, a);
  }
  const out = new Map<string, AttributeHandle>();

  for (const def of GLOBAL_ATTRIBUTES) {
    const taxonomy = def.taxonomy;
    let found = bySlug.get(taxonomy);
    if (!found) {
      found = await client.post<WooAttrRes>("products/attributes", {
        name: def.name,
        slug: def.slug,
        type: def.type,
        order_by: def.order_by,
        has_archives: def.has_archives,
      });
    }
    out.set(taxonomy, { taxonomy, id: found.id, termIdBySlug: new Map() });
  }
  return out;
}

// ──────────────────────────────────────────────────────────────────────────────
// Ensure attribute terms (idempotent, with menu_order)
// ──────────────────────────────────────────────────────────────────────────────

export async function ensureAttributeTerms(
  client: WooClient,
  handle: AttributeHandle,
  terms: Array<{ slug: string; name: string; menu_order?: number }>,
): Promise<void> {
  if (terms.length === 0) return;

  // Fetch existing terms once (paginated)
  const existing = await fetchAllTerms(client, handle.id);
  const bySlug = new Map(existing.map((t) => [t.slug, t]));

  for (const t of terms) {
    if (!t.slug) continue;
    if (handle.termIdBySlug.has(t.slug)) continue;
    const ex = bySlug.get(t.slug);
    if (ex) {
      handle.termIdBySlug.set(t.slug, ex.id);
      // Update menu_order if it changed
      if (t.menu_order !== undefined && ex.menu_order !== t.menu_order) {
        await client.put(`products/attributes/${handle.id}/terms/${ex.id}`, {
          menu_order: t.menu_order,
        });
      }
      continue;
    }
    const created = await client.post<WooTermRes>(
      `products/attributes/${handle.id}/terms`,
      { name: t.name, slug: t.slug, menu_order: t.menu_order ?? 0 },
    );
    handle.termIdBySlug.set(created.slug, created.id);
  }
}

async function fetchAllTerms(client: WooClient, attrId: number): Promise<WooTermRes[]> {
  const all: WooTermRes[] = [];
  let page = 1;
  while (true) {
    const batch = await client.get<WooTermRes[]>(
      `products/attributes/${attrId}/terms?per_page=100&page=${page}`,
    );
    all.push(...batch);
    if (batch.length < 100) break;
    page++;
    if (page > 20) break; // safety
  }
  return all;
}

// ──────────────────────────────────────────────────────────────────────────────
// Ensure category tree
// ──────────────────────────────────────────────────────────────────────────────

export interface CategoryHandle {
  slug: string;
  id: number;
  parent: number;
}

export async function ensureCategoryTree(client: WooClient): Promise<Map<string, CategoryHandle>> {
  const existing = await fetchAllCategories(client);
  const bySlug = new Map(existing.map((c) => [c.slug, c]));
  const out = new Map<string, CategoryHandle>();

  // Two passes: top-level first, then children.
  const sorted = [...CATEGORY_TREE].sort((a, b) => Number(!!a.parent) - Number(!!b.parent));

  for (const def of sorted) {
    const ex = bySlug.get(def.slug);
    const parentId = def.parent ? (out.get(def.parent)?.id ?? 0) : 0;
    if (ex) {
      out.set(def.slug, { slug: ex.slug, id: ex.id, parent: ex.parent });
      if (parentId && ex.parent !== parentId) {
        // Fix wrong parent if needed
        await client.put(`products/categories/${ex.id}`, { parent: parentId });
      }
      continue;
    }
    const created = await client.post<WooCategoryRes>("products/categories", {
      name: def.name,
      slug: def.slug,
      description: def.description ?? "",
      parent: parentId,
    });
    out.set(created.slug, { slug: created.slug, id: created.id, parent: created.parent });
  }
  return out;
}

async function fetchAllCategories(client: WooClient): Promise<WooCategoryRes[]> {
  const all: WooCategoryRes[] = [];
  let page = 1;
  while (true) {
    const batch = await client.get<WooCategoryRes[]>(
      `products/categories?per_page=100&hide_empty=false&page=${page}`,
    );
    all.push(...batch);
    if (batch.length < 100) break;
    page++;
    if (page > 10) break;
  }
  return all;
}

// ──────────────────────────────────────────────────────────────────────────────
// Product creation
// ──────────────────────────────────────────────────────────────────────────────

export async function fetchExistingProductSlugs(client: WooClient): Promise<Map<string, WooProductRes>> {
  const map = new Map<string, WooProductRes>();
  let page = 1;
  while (true) {
    const batch = await client.get<WooProductRes[]>(
      `products?per_page=100&status=any&page=${page}`,
    );
    for (const p of batch) map.set(p.slug, p);
    if (batch.length < 100) break;
    page++;
    if (page > 50) break;
  }
  return map;
}

export interface CreateProductDeps {
  client: WooClient;
  attrs: Map<string, AttributeHandle>;
  cats: Map<string, CategoryHandle>;
}

export async function createProduct(deps: CreateProductDeps, p: PlannedProduct): Promise<WooProductRes> {
  const { client, attrs, cats } = deps;

  // Resolve category ids
  const categoryIds: Array<{ id: number }> = [];
  for (const c of p.categories) {
    const h = cats.get(c.slug);
    if (h) categoryIds.push({ id: h.id });
  }

  // Build attributes payload referencing taxonomy ids + term slugs → ids
  const attributesBody = p.attributes
    .map((a) => {
      const handle = attrs.get(a.slug);
      if (!handle) return null;
      return {
        id: handle.id,
        position: a.position,
        visible: a.visible,
        variation: a.variation,
        options: a.options.map((s) => a.termLabels[s] ?? s), // Woo wants term NAMES here
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const body: Record<string, unknown> = {
    name: p.name,
    slug: p.slug,
    type: p.type,
    status: p.status,
    description: p.description,
    short_description: p.short_description,
    categories: categoryIds,
    tags: p.tags.map((name) => ({ name })),
    images: p.images.map((i) => ({ src: i.src, alt: i.alt ?? "" })),
    attributes: attributesBody,
    meta_data: p.meta,
  };

  if (p.type === "simple" && p.simplePrice) {
    body.regular_price = p.simplePrice.regular_price;
    if (p.simplePrice.sale_price) body.sale_price = p.simplePrice.sale_price;
    if (p.simplePrice.sku) body.sku = p.simplePrice.sku;
    body.manage_stock = p.manage_stock;
    body.stock_quantity = p.stock_quantity;
    body.stock_status = p.stock_status;
  }

  // POST with long timeout (Woo sideloads images synchronously) and
  // noRetryOnTimeout (the first call may have already committed).
  let product: WooProductRes;
  try {
    product = await client.post<WooProductRes>("products", body, {
      timeoutMs: PRODUCT_CREATE_TIMEOUT_MS,
      noRetryOnTimeout: true,
    });
  } catch (err) {
    if (err instanceof TimeoutError || isDuplicateSlugError(err)) {
      // Recover: the product may have been created. Query by slug.
      const existing = await client.get<WooProductRes[]>(
        `products?slug=${encodeURIComponent(p.slug)}&status=any`,
      );
      if (existing.length > 0 && existing[0]) {
        product = existing[0];
      } else {
        throw err;
      }
    } else {
      throw err;
    }
  }

  // Variations (batch)
  if (p.type === "variable" && p.variants.length > 0) {
    // Check which variations already exist (for recovery case)
    const existingVars = await client.get<Array<{ id: number; sku: string }>>(
      `products/${product.id}/variations?per_page=100`,
    ).catch(() => [] as Array<{ id: number; sku: string }>);
    const existingSkus = new Set(existingVars.map((v) => v.sku).filter(Boolean));

    const createBodies = p.variants
      .filter((v) => !existingSkus.has(v.sku))
      .map((v) => {
        const varAttrs = v.attributes.map((va) => {
          const handle = attrs.get(va.slug);
          return { id: handle?.id, option: va.option };
        });
        const vb: Record<string, unknown> = {
          sku: v.sku,
          regular_price: v.regular_price,
          manage_stock: v.manage_stock,
          stock_quantity: v.stock_quantity,
          stock_status: v.stock_status,
          attributes: varAttrs,
        };
        if (v.sale_price) vb.sale_price = v.sale_price;
        if (v.image) vb.image = v.image;
        return vb;
      });

    if (createBodies.length > 0) {
      const chunks = chunk(createBodies, 50);
      for (const c of chunks) {
        await client.post(
          `products/${product.id}/variations/batch`,
          { create: c },
          { timeoutMs: PRODUCT_CREATE_TIMEOUT_MS, noRetryOnTimeout: true },
        );
      }
    }
  }

  return product;
}

function isDuplicateSlugError(err: unknown): boolean {
  if (!(err instanceof HttpError)) return false;
  // Woo returns 400 with code `product_invalid_sku` or term_exists
  return /invalid_sku|term_exists|already exists|slug.*already/i.test(err.body);
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
