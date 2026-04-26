import type { Product, ProductCategory, ProductCategoryNode, ProductSummary } from "@/lib/woo/types";

/**
 * Listing query shape. Kept plain & serializable so it can be sourced from
 * URL search params without a transform layer.
 */
export interface ListProductsQuery {
  /** Category slug (single). */
  category?: string;
  /**
   * Multiple category slugs — products matching ANY of these are returned.
   * Used by "Featured Collection" sections that span several categories.
   */
  categories?: string[];
  /** Full-text search term (Phase 3 Meili takes over — fixture adapter does a naive contains). */
  search?: string;
  /** Sort order. */
  sort?: "featured" | "newest" | "price-asc" | "price-desc";
  /** 1-based page. */
  page?: number;
  /** Items per page. */
  pageSize?: number;

  // ── Phase 3 filters (Sprint 4) ──
  /** Filter to products that have one of these size options. */
  sizes?: string[];
  /** Filter to products that have one of these color options. */
  colors?: string[];
  /** Minimum price in cents (inclusive). */
  priceMin?: number;
  /** Maximum price in cents (inclusive). */
  priceMax?: number;
  /** When true, only return in-stock products. */
  inStock?: boolean;

  // ── Section-driven filters (Sprint 7: modular sections) ──
  /** Curated manual list — products with one of these slugs. */
  slugs?: string[];
  /** Curated manual list — products with one of these ids. */
  ids?: string[];
  /** Single tag slug — maps to Woo's `tag`. */
  tag?: string;
  /** Multiple tag slugs — products matching ANY of these. */
  tags?: string[];
  /** WooCommerce "Featured" flag. */
  featured?: boolean;
  /** Only products on sale. */
  onSale?: boolean;
}

export interface ListProductsResult {
  items: ProductSummary[];
  total: number;
  page: number;
  pageCount: number;
}

/**
 * Data source for the storefront's READ path.
 *
 * We program against this interface everywhere. Today it's backed by fixtures
 * (`lib/catalog/fixtures`). In Phase 1b+ we swap the adapter to hit the live
 * WooCommerce Store API. Components, routes, and tests never change.
 */
export interface CatalogDataSource {
  listProducts(query: ListProductsQuery): Promise<ListProductsResult>;
  getProductBySlug(slug: string): Promise<Product | null>;
  listCategories(): Promise<ProductCategory[]>;
  getCategoryBySlug(slug: string): Promise<ProductCategory | null>;
  /**
   * Resolve a specific set of categories by slug. Returns the matches in the
   * same order they were requested; unknown slugs are silently dropped.
   * Used by section components that curate a manual list of categories.
   */
  listCategoriesBySlugs(slugs: string[]): Promise<ProductCategory[]>;
  /**
   * All categories arranged as a tree (root nodes only at top; children
   * nested). Category pickers and nested navigation consume this.
   */
  listCategoryTree(): Promise<ProductCategoryNode[]>;
}
