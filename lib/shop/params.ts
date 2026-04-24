/**
 * Shop URL-param helpers.
 *
 * The canonical listing state lives in the URL (`?sort=...&page=2&q=...`).
 * That gives us shareable links, correct back/forward behaviour, and SSR
 * rendering of the right data on first paint — no client-only state.
 *
 * This module is the single place to read/parse/write those params so every
 * control (SortSelect, SearchBar, Pagination, category chips) stays in sync
 * with what the server page actually consumes.
 *
 * Pure, framework-free, easy to unit test.
 */

export type SortValue = "featured" | "newest" | "price-asc" | "price-desc";

export const SORT_OPTIONS: { value: SortValue; label: string }[] = [
  { value: "featured",    label: "Featured" },
  { value: "newest",      label: "Newest" },
  { value: "price-asc",   label: "Price: Low to High" },
  { value: "price-desc",  label: "Price: High to Low" },
];

const VALID_SORTS: ReadonlySet<string> = new Set(SORT_OPTIONS.map((o) => o.value));

/** Default sort when none is present. */
export const DEFAULT_SORT: SortValue = "featured";

/** Narrows a free-form string to a valid SortValue, falling back to default. */
export function parseSort(value: string | undefined | null): SortValue {
  return value && VALID_SORTS.has(value) ? (value as SortValue) : DEFAULT_SORT;
}

/** Parses a 1-based page number; coerces garbage to 1. */
export function parsePage(value: string | undefined | null): number {
  const n = Number(value);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

/** Trims search to a single-line, length-capped value. Empty string means "no search". */
export function parseSearch(value: string | undefined | null): string {
  if (!value) return "";
  return value.replace(/\s+/g, " ").trim().slice(0, 120);
}

/**
 * Build a new URLSearchParams from an existing one, applying a patch.
 * `null`/`undefined` removes a param; all other values are stringified.
 * Also strips `sort` when it equals the default and `page` when it's 1,
 * keeping URLs clean.
 */
export function buildShopSearch(
  current: URLSearchParams | Record<string, string | string[] | undefined>,
  patch: Record<string, string | number | null | undefined>,
): string {
  const next = new URLSearchParams(
    current instanceof URLSearchParams
      ? current
      : flattenRecord(current),
  );

  for (const [key, raw] of Object.entries(patch)) {
    if (raw === null || raw === undefined || raw === "") {
      next.delete(key);
      continue;
    }
    next.set(key, String(raw));
  }

  // Canonicalise defaults.
  if (next.get("sort") === DEFAULT_SORT) next.delete("sort");
  if (next.get("page") === "1") next.delete("page");

  return next.toString();
}

function flattenRecord(
  r: Record<string, string | string[] | undefined>,
): [string, string][] {
  const out: [string, string][] = [];
  for (const [k, v] of Object.entries(r)) {
    if (v === undefined) continue;
    if (Array.isArray(v)) v.forEach((vv) => out.push([k, vv]));
    else out.push([k, v]);
  }
  return out;
}

// ── Filter param helpers (Sprint 4) ───────────────────────────────────────

export interface ShopFilters {
  sizes: string[];
  colors: string[];
  priceMin: number | undefined;
  priceMax: number | undefined;
  inStock: boolean;
}

export const EMPTY_FILTERS: ShopFilters = {
  sizes: [],
  colors: [],
  priceMin: undefined,
  priceMax: undefined,
  inStock: false,
};

/**
 * Parse all filter-related search params from the URL into a typed object.
 * Rejects any obviously invalid values — callers get safe defaults.
 */
export function parseFilters(
  raw: URLSearchParams | Record<string, string | string[] | undefined>,
): ShopFilters {
  const p =
    raw instanceof URLSearchParams
      ? raw
      : new URLSearchParams(flattenRecord(raw));

  const sizes = (p.get("sizes") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const colors = (p.get("colors") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const priceMinRaw = Number(p.get("price_min") ?? "");
  const priceMaxRaw = Number(p.get("price_max") ?? "");

  return {
    sizes,
    colors,
    priceMin: Number.isFinite(priceMinRaw) && priceMinRaw > 0 ? priceMinRaw : undefined,
    priceMax: Number.isFinite(priceMaxRaw) && priceMaxRaw > 0 ? priceMaxRaw : undefined,
    inStock: p.get("in_stock") === "1",
  };
}

/** Count how many distinct filters are active. */
export function countActiveFilters(f: ShopFilters): number {
  return (
    f.sizes.length +
    f.colors.length +
    (f.priceMin !== undefined ? 1 : 0) +
    (f.priceMax !== undefined ? 1 : 0) +
    (f.inStock ? 1 : 0)
  );
}
