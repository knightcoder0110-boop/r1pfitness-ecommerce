/**
 * scripts/seed/types.ts
 *
 * Shared types for the Shopify → WooCommerce seed pipeline.
 */

// ── Parsed CSV row (by header name) ───────────────────────────────────────────
export type CsvRow = Readonly<Record<string, string>>;

// ── Raw variant, as parsed from one CSV row ───────────────────────────────────
export interface RawVariant {
  /** Raw Option{1,2,3} Value, untransformed */
  opt1: string;
  opt2: string;
  opt3: string;
  price: string;           // "36.00"
  compareAt: string;       // "" or "48.00"
  sku: string;             // may be empty
  barcode: string;
  weightGrams: string;
  requiresShipping: boolean;
  taxable: boolean;
  variantImage: string;    // absolute URL
}

// ── Product-level metafields harvested from Shopify (post_meta map for ACF) ──
export interface ShopifyMetafields {
  activity?: string;
  age_group?: string;
  clothing_features?: string;
  activewear_features?: string;
  color_pattern?: string;
  fabric?: string;
  fit?: string;
  neckline?: string;
  sleeve_length?: string;
  top_length?: string;
  target_gender?: string;
  waist_rise?: string;
  pants_length?: string;
  headwear_features?: string;
  accessory_size?: string;
  bag_case_material?: string;
  bag_case_features?: string;
  bag_case_storage_features?: string;
  carry_options?: string;
  flavor?: string;
  dietary_preferences?: string;
  ticket_type?: string;
  search_boosts?: string;
}

// ── A full product as grouped from consecutive CSV rows ──────────────────────
export interface ProductGroup {
  handle: string;
  title: string;
  bodyHtml: string;
  vendor: string;
  productCategory: string;     // raw Google taxonomy string
  type: string;                // Shopify "Type"
  tags: string;                // raw CSV tag field
  published: boolean;
  status: string;              // active / draft / archived
  opt1Name: string;
  opt2Name: string;
  opt3Name: string;
  seoTitle: string;
  seoDescription: string;
  images: Array<{ src: string; pos: number; alt: string }>;
  variants: RawVariant[];
  metafields: ShopifyMetafields;
}

// ── The planned product that will be POSTed to Woo ───────────────────────────
export interface PlannedVariant {
  sku: string;
  regular_price: string;
  sale_price?: string;
  attributes: Array<{ name: string; slug: string; option: string }>;
  stock_quantity: number;
  stock_status: "instock" | "onbackorder" | "outofstock";
  manage_stock: boolean;
  image?: { src: string };
  shopify_opt1: string;
  shopify_opt2: string;
  shopify_opt3: string;
}

export interface PlannedProduct {
  /** Shopify source handle — stored as post_meta _shopify_handle */
  sourceHandle: string;
  slug: string;
  name: string;
  type: "simple" | "variable";
  status: "publish" | "draft";
  description: string;
  short_description: string;
  categories: Array<{ slug: string; name: string; parent?: string }>;
  tags: string[];
  images: Array<{ src: string; alt?: string }>;
  /** Global attributes (pa_*) — always uses taxonomy, never ad-hoc */
  attributes: Array<{
    slug: string;              // "pa_size"
    name: string;              // "Size"
    position: number;
    visible: boolean;
    variation: boolean;
    options: string[];         // term slugs (pa_* taxonomy slugs)
    /** label map: slug -> display name (used when ensuring terms) */
    termLabels: Record<string, string>;
    /** menu order map: slug -> menu_order (used when ensuring terms) */
    termMenuOrder?: Record<string, number>;
  }>;
  variants: PlannedVariant[];
  /** Simple-product price info (undefined for variable) */
  simplePrice?: { regular_price: string; sale_price?: string; sku: string };
  /** Yoast + ACF meta that must be written as post_meta */
  meta: Array<{ key: string; value: string }>;
  /** Default stock applied to simple / per variant */
  stock_quantity: number;
  stock_status: "instock" | "onbackorder" | "outofstock";
  manage_stock: boolean;
}

export type SkipReason =
  | "non-apparel-category"
  | "no-images"
  | "service-or-membership"
  | "offline-only"
  | "manual-exclude"
  | "empty-product"
  | "archived";

export interface SkippedItem {
  handle: string;
  title: string;
  reason: SkipReason;
  detail: string;
}

export interface SeedPlan {
  generatedAt: string;
  csvPath: string;
  wooBaseUrl: string;
  counts: {
    csvHandles: number;
    toCreate: number;
    skipped: number;
    totalVariants: number;
  };
  planned: PlannedProduct[];
  skipped: SkippedItem[];
  /** Unique attribute-term pairs we must pre-create */
  attributeTerms: Array<{
    taxonomy: string;          // "pa_size"
    slug: string;              // "2xl"
    name: string;              // "2XL"
    menu_order?: number;
  }>;
  /** Unique categories we must pre-create (flat, parent-resolvable by slug) */
  categories: Array<{ slug: string; name: string; parent?: string; description?: string }>;
}

export type Mode = "plan" | "seed" | "update" | "resync";

export interface CliOptions {
  mode: Mode;
  only?: string;               // glob or substring
  limit?: number;
  verbose: boolean;
  includeManifest: boolean;    // include manually-excluded entries (disable seed-exclude)
  skipImages: boolean;         // don't send images (faster dry runs)
}
