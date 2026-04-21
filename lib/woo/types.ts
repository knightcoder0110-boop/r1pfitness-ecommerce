/**
 * Normalized domain types for the commerce layer.
 *
 * THESE types are the storefront's contract. Raw WooCommerce response shapes
 * never escape `lib/woo/mappers.ts`. If we ever swap WooCommerce for another
 * platform, only the mapper layer changes — every component keeps working.
 *
 * Rules:
 * - Money is in MINOR units (cents). Never floating-point dollars.
 * - IDs are strings at the domain boundary (even if Woo uses numbers).
 * - Optional fields use `?` only for truly optional data; use explicit `null`
 *   for "known empty" where the distinction matters.
 */

export interface Money {
  /** Amount in minor units (e.g. cents for USD). */
  amount: number;
  /** ISO 4217 currency code. */
  currency: string;
}

export interface ImageRef {
  id: string;
  url: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface SeoFields {
  title?: string;
  description?: string;
  ogImage?: string;
}

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export interface ProductAttribute {
  /** Slug, e.g. "pa_size" */
  id: string;
  /** Display name, e.g. "Size" */
  name: string;
  /** Ordered list of available terms */
  options: string[];
  /** Whether this attribute is used to define variations */
  variation: boolean;
  /** Whether this attribute is surfaced as a filter on listings */
  visible: boolean;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
}

export interface ProductVariation {
  id: string;
  sku: string;
  price: Money;
  compareAtPrice?: Money;
  stockStatus: StockStatus;
  stockQuantity?: number;
  /** Map of attribute slug -> selected option, e.g. { "pa_size": "M", "pa_color": "Black" } */
  attributes: Record<string, string>;
  image?: ImageRef;
}

export interface ProductMeta {
  fitType?: string;
  fabricDetails?: string;
  printMethod?: string;
  careInstructions?: string;
  designStory?: string;
  sizeChart?: SizeChartRow[];
  isLimited?: boolean;
  dropDate?: string;
}

export interface SizeChartRow {
  size: string;
  chest?: string;
  waist?: string;
  length?: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  shortDescription: string;
  price: Money;
  compareAtPrice?: Money;
  images: ImageRef[];
  categories: ProductCategory[];
  tags: string[];
  attributes: ProductAttribute[];
  variations: ProductVariation[];
  stockStatus: StockStatus;
  stockQuantity?: number;
  meta: ProductMeta;
  seo: SeoFields;
}

export interface ProductSummary {
  id: string;
  slug: string;
  name: string;
  price: Money;
  compareAtPrice?: Money;
  image?: ImageRef;
  stockStatus: StockStatus;
  isLimited: boolean;
}

export interface Address {
  firstName: string;
  lastName: string;
  company?: string;
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  phone?: string;
  email?: string;
}

export interface CartLineItem {
  /**
   * Local stable key: `productId::variationId` for optimistically-added items.
   * For items loaded from the WooCommerce server via reconciliation, this IS
   * the WC opaque key (since mapCartItem sets key = raw.key).
   */
  key: string;
  /**
   * WooCommerce cart item key (opaque alphanumeric string from Store API).
   * Populated after a successful BFF add mutation. Required for BFF
   * update/remove calls when the item was added optimistically.
   * If undefined, fall back to `key` (which IS the WC key for server-loaded items).
   */
  wooKey?: string;
  productId: string;
  variationId?: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: Money;
  subtotal: Money;
  image?: ImageRef;
  attributes: Record<string, string>;
}

export interface Cart {
  token: string;
  currency: string;
  items: CartLineItem[];
  itemCount: number;
  subtotal: Money;
  discountTotal: Money;
  shippingTotal: Money;
  taxTotal: Money;
  total: Money;
  coupons: AppliedCoupon[];
}

export interface AppliedCoupon {
  code: string;
  discount: Money;
}

export type OrderStatus =
  | "pending"
  | "processing"
  | "on_hold"
  | "completed"
  | "cancelled"
  | "refunded"
  | "failed";

export interface Order {
  id: string;
  number: string;
  status: OrderStatus;
  currency: string;
  createdAt: string;
  updatedAt: string;
  subtotal: Money;
  discountTotal: Money;
  shippingTotal: Money;
  taxTotal: Money;
  total: Money;
  billing: Address;
  shipping: Address;
  items: CartLineItem[];
}

export interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  billing?: Address;
  shipping?: Address;
}
