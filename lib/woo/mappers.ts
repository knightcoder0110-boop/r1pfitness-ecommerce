import type {
  Cart,
  CartLineItem,
  ImageRef,
  Money,
  Product,
  ProductAttribute,
  ProductCategory,
  ProductSummary,
  ProductVariation,
  StockStatus,
} from "./types";
import { proxyWooImageUrl } from "./image-proxy";

/**
 * Raw shapes from the WooCommerce Store API (`/wp-json/wc/store/v1`).
 *
 * These are narrow enough to capture what the mappers actually consume. We
 * intentionally don't model every field — if we need more, we extend the
 * raw type + mapper together.
 */

export interface RawStorePrices {
  price: string;
  regular_price: string;
  sale_price?: string;
  currency_code: string;
  currency_minor_unit: number;
}

export interface RawStoreImage {
  id: number;
  src: string;
  thumbnail?: string;
  alt?: string;
  name?: string;
}

export interface RawStoreAttribute {
  id?: number;
  name: string;
  taxonomy?: string;
  has_variations?: boolean;
  terms?: Array<{ name: string; slug: string }>;
}

export interface RawStoreProduct {
  id: number;
  name: string;
  slug: string;
  permalink?: string;
  description?: string;
  short_description?: string;
  sku?: string;
  prices: RawStorePrices;
  images?: RawStoreImage[];
  categories?: Array<{ id: number; name: string; slug: string }>;
  tags?: Array<{ id: number; name: string; slug: string }>;
  attributes?: RawStoreAttribute[];
  variations?: Array<{ id: number; attributes: Array<{ name: string; value: string }> }>;
  is_in_stock?: boolean;
  low_stock_remaining?: number | null;
  stock_quantity?: number | null;
  meta_data?: Array<{ key: string; value: unknown }>;
  /** ISO 8601 datetime of last modification, e.g. "2024-11-01T10:30:00" */
  date_modified?: string;
}

export interface RawStoreVariation {
  id: number;
  sku?: string;
  prices: RawStorePrices;
  attributes: Array<{ name: string; value: string }>;
  image?: RawStoreImage;
  is_in_stock?: boolean;
  low_stock_remaining?: number | null;
  stock_quantity?: number | null;
}

export interface RawStoreCartItem {
  key: string;
  id: number;
  quantity: number;
  name: string;
  sku?: string;
  variation?: Array<{ attribute: string; value: string }>;
  images?: RawStoreImage[];
  prices: RawStorePrices;
  totals: {
    line_subtotal: string;
    line_total: string;
    currency_code: string;
    currency_minor_unit: number;
  };
}

export interface RawStoreCart {
  items: RawStoreCartItem[];
  items_count: number;
  totals: {
    total_items: string;
    total_price: string;
    total_discount: string;
    total_shipping: string;
    total_tax: string;
    currency_code: string;
    currency_minor_unit: number;
  };
  coupons?: Array<{
    code: string;
    totals: { total_discount: string; currency_code: string; currency_minor_unit: number };
  }>;
}

/**
 * Raw `/products/categories` entry from the Store API. Fields we care about;
 * Woo returns more (`display`, `menu_order`, `review_count`) we don't map.
 */
export interface RawStoreCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parent?: number;
  count?: number;
  image?: RawStoreImage;
}

/**
 * Convert a raw price string (already in minor units per Store API contract)
 * into a number. Defensive against whitespace, empty strings, NaN input.
 */
export function toMinorUnits(input: string | number | undefined | null): number {
  if (input === undefined || input === null || input === "") return 0;
  const n = typeof input === "number" ? input : Number(String(input).trim());
  if (!Number.isFinite(n)) return 0;
  return Math.round(n);
}

function money(amount: string | number | undefined | null, currency: string): Money {
  return { amount: toMinorUnits(amount), currency };
}

function mapImage(raw: RawStoreImage | undefined): ImageRef | undefined {
  if (!raw) return undefined;
  return {
    id: String(raw.id),
    // Proxy Cloudways-hosted URLs through our local API route so Next.js image
    // optimisation never sees the NAT64 address that the Cloudways host resolves
    // to. For all other URLs (fixtures, CDNs, etc.) the URL is returned as-is.
    url: proxyWooImageUrl(raw.src),
    alt: raw.alt ?? raw.name ?? "",
  };
}

function mapImages(raw: RawStoreImage[] | undefined): ImageRef[] {
  if (!raw) return [];
  // WooCommerce sometimes returns the same image attachment more than once in
  // the `images` array (e.g. when a product's gallery image was set as the
  // featured image too). Deduplicate by numeric ID so React never sees two
  // children with the same `key`.
  const seen = new Set<number>();
  return raw
    .filter((img) => {
      if (seen.has(img.id)) return false;
      seen.add(img.id);
      return true;
    })
    .map((img) => mapImage(img))
    .filter((img): img is ImageRef => img !== undefined);
}

function deriveStockStatus(input: {
  is_in_stock?: boolean;
  low_stock_remaining?: number | null;
  stock_quantity?: number | null;
}): StockStatus {
  if (input.is_in_stock === false) return "out_of_stock";
  if (typeof input.low_stock_remaining === "number" && input.low_stock_remaining > 0) {
    return "low_stock";
  }
  if (typeof input.stock_quantity === "number" && input.stock_quantity <= 3) {
    return "low_stock";
  }
  return "in_stock";
}

function mapCategories(
  raw: Array<{ id: number; name: string; slug: string }> | undefined,
): ProductCategory[] {
  if (!raw) return [];
  return raw.map((c) => ({ id: String(c.id), name: c.name, slug: c.slug }));
}

/**
 * Map a full `/products/categories` entry into the domain type, including
 * cover image, description, count, and parent id. Used by
 * `listStoreCategories` / `getStoreCategoryBySlug`.
 */
export function mapCategory(raw: RawStoreCategory): ProductCategory {
  const out: ProductCategory = {
    id: String(raw.id),
    name: raw.name,
    slug: raw.slug,
  };
  if (raw.description) out.description = raw.description;
  if (typeof raw.count === "number") out.count = raw.count;
  // parent=0 means "root" in Woo — we normalise that to undefined.
  if (typeof raw.parent === "number" && raw.parent > 0) {
    out.parentId = String(raw.parent);
  }
  if (raw.image) {
    const img = mapImage(raw.image);
    if (img) out.image = img;
  }
  return out;
}

function mapAttributes(raw: RawStoreAttribute[] | undefined): ProductAttribute[] {
  if (!raw) return [];
  return raw.map((a) => ({
    id: a.taxonomy ?? a.name,
    name: a.name,
    options: (a.terms ?? []).map((t) => t.name),
    variation: a.has_variations ?? false,
    visible: true,
  }));
}

function mapMetaDataRecord(raw: RawStoreProduct["meta_data"]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!raw) return out;
  for (const entry of raw) {
    if (entry.key) out[entry.key] = entry.value;
  }
  return out;
}

/**
 * Map a raw Store API product into our domain `Product`. Pure; no I/O.
 * Variations are left empty here — load them separately and attach via
 * the data-source layer (see `lib/catalog`).
 */
export function mapProduct(raw: RawStoreProduct): Product {
  const currency = raw.prices.currency_code;
  const meta = mapMetaDataRecord(raw.meta_data);

  return {
    id: String(raw.id),
    slug: raw.slug,
    name: raw.name,
    description: raw.description ?? "",
    shortDescription: raw.short_description ?? "",
    price: money(raw.prices.price, currency),
    ...(raw.prices.regular_price && raw.prices.regular_price !== raw.prices.price
      ? { compareAtPrice: money(raw.prices.regular_price, currency) }
      : {}),
    images: mapImages(raw.images),
    categories: mapCategories(raw.categories),
    tags: (raw.tags ?? []).map((t) => t.name),
    attributes: mapAttributes(raw.attributes),
    variations: [],
    stockStatus: deriveStockStatus(raw),
    ...(typeof raw.stock_quantity === "number" ? { stockQuantity: raw.stock_quantity } : {}),
    meta: {
      ...(typeof meta["fit_type"] === "string" ? { fitType: meta["fit_type"] } : {}),
      ...(typeof meta["fabric_details"] === "string"
        ? { fabricDetails: meta["fabric_details"] }
        : {}),
      ...(typeof meta["print_method"] === "string"
        ? { printMethod: meta["print_method"] }
        : {}),
      ...(typeof meta["care_instructions"] === "string"
        ? { careInstructions: meta["care_instructions"] }
        : {}),
      ...(typeof meta["design_story"] === "string"
        ? { designStory: meta["design_story"] }
        : {}),
      ...(meta["is_limited"] === true || meta["is_limited"] === "1"
        ? { isLimited: true }
        : {}),
      ...(typeof meta["drop_date"] === "string" ? { dropDate: meta["drop_date"] } : {}),
    },
    seo: {
      ...(typeof meta["seo_title"] === "string" ? { title: meta["seo_title"] } : {}),
      ...(typeof meta["seo_description"] === "string"
        ? { description: meta["seo_description"] }
        : {}),
    },
  };
}

/**
 * Lightweight summary for listings. Cheaper to serialize, no description.
 */
export function mapProductSummary(raw: RawStoreProduct): ProductSummary {
  const currency = raw.prices.currency_code;
  const first = raw.images?.[0];
  const second = raw.images?.[1];
  const meta = mapMetaDataRecord(raw.meta_data);

  // Extract color / size option lists for swatch rendering on cards.
  const attrs = raw.attributes ?? [];
  const colorAttr = attrs.find((a) => /colou?r/i.test(a.name) || a.taxonomy === "pa_color");
  const sizeAttr = attrs.find((a) => /^size$/i.test(a.name) || a.taxonomy === "pa_size");
  const colorOptions = colorAttr?.terms?.map((t) => t.name).filter(Boolean) ?? [];
  const sizeOptions = sizeAttr?.terms?.map((t) => t.name).filter(Boolean) ?? [];

  return {
    id: String(raw.id),
    slug: raw.slug,
    name: raw.name,
    price: money(raw.prices.price, currency),
    ...(raw.prices.regular_price && raw.prices.regular_price !== raw.prices.price
      ? { compareAtPrice: money(raw.prices.regular_price, currency) }
      : {}),
    ...(first ? { image: mapImage(first) } : {}),
    ...(second ? { hoverImage: mapImage(second) } : {}),
    stockStatus: deriveStockStatus(raw),
    isLimited: meta["is_limited"] === true || meta["is_limited"] === "1",
    ...(colorOptions.length ? { colorOptions } : {}),
    ...(sizeOptions.length ? { sizeOptions } : {}),
    ...(raw.variations?.length ? { variantCount: raw.variations.length } : {}),
    ...(raw.date_modified ? { updatedAt: raw.date_modified } : {}),
  };
}

export function mapVariation(raw: RawStoreVariation): ProductVariation {
  const currency = raw.prices.currency_code;
  const attributes: Record<string, string> = {};
  for (const a of raw.attributes) attributes[a.name] = a.value;
  return {
    id: String(raw.id),
    sku: raw.sku ?? "",
    price: money(raw.prices.price, currency),
    ...(raw.prices.regular_price && raw.prices.regular_price !== raw.prices.price
      ? { compareAtPrice: money(raw.prices.regular_price, currency) }
      : {}),
    stockStatus: deriveStockStatus(raw),
    ...(typeof raw.stock_quantity === "number" ? { stockQuantity: raw.stock_quantity } : {}),
    attributes,
    ...(raw.image ? { image: mapImage(raw.image) as ImageRef } : {}),
  };
}

export function mapCartItem(raw: RawStoreCartItem): CartLineItem {
  const currency = raw.totals.currency_code;
  const attributes: Record<string, string> = {};
  for (const v of raw.variation ?? []) attributes[v.attribute] = v.value;
  const firstImg = raw.images?.[0];
  return {
    key: raw.key,
    productId: String(raw.id),
    name: raw.name,
    sku: raw.sku ?? "",
    quantity: raw.quantity,
    unitPrice: money(raw.prices.price, currency),
    subtotal: money(raw.totals.line_subtotal, currency),
    attributes,
    ...(firstImg ? { image: mapImage(firstImg) as ImageRef } : {}),
  };
}

export function mapCart(raw: RawStoreCart, token: string): Cart {
  const currency = raw.totals.currency_code;
  return {
    token,
    currency,
    items: raw.items.map(mapCartItem),
    itemCount: raw.items_count,
    subtotal: money(raw.totals.total_items, currency),
    discountTotal: money(raw.totals.total_discount, currency),
    shippingTotal: money(raw.totals.total_shipping, currency),
    taxTotal: money("0", currency),
    total: money(raw.totals.total_price, currency),
    coupons: (raw.coupons ?? []).map((c) => ({
      code: c.code,
      discount: money(c.totals.total_discount, c.totals.currency_code),
    })),
  };
}
