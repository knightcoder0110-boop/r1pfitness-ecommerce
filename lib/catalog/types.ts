import type { Product, ProductCategory, ProductSummary } from "@/lib/woo/types";

/**
 * Listing query shape. Kept plain & serializable so it can be sourced from
 * URL search params without a transform layer.
 */
export interface ListProductsQuery {
  /** Category slug (single). */
  category?: string;
  /** Full-text search term (Phase 3 Meili takes over — fixture adapter does a naive contains). */
  search?: string;
  /** Sort order. */
  sort?: "featured" | "newest" | "price-asc" | "price-desc";
  /** 1-based page. */
  page?: number;
  /** Items per page. */
  pageSize?: number;
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
}
