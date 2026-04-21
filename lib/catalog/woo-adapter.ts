import "server-only";

import {
  getStoreCategoryBySlug,
  getStoreProductBySlug,
  listStoreCategories,
  listStoreProducts,
} from "@/lib/woo/products";
import type { ProductSummary } from "@/lib/woo/types";
import type { CatalogDataSource, ListProductsQuery, ListProductsResult } from "./types";

/**
 * Live WooCommerce-backed catalog adapter.
 *
 * Implements the same `CatalogDataSource` contract as the fixture adapter —
 * every caller (server components, API routes, tests) is unchanged.
 *
 * Woo Store API natively supports `page`, `per_page`, `category` (slug),
 * `search`, `orderby`, `order`. We translate the storefront's friendly
 * `sort` enum to Woo params here.
 */

const DEFAULT_PAGE_SIZE = 12;

type OrderBy = "date" | "price" | "popularity" | "menu_order";
type Order = "asc" | "desc";

function sortToStoreParams(sort: ListProductsQuery["sort"]): {
  orderby: OrderBy;
  order: Order;
} {
  switch (sort) {
    case "price-asc":
      return { orderby: "price", order: "asc" };
    case "price-desc":
      return { orderby: "price", order: "desc" };
    case "newest":
      return { orderby: "date", order: "desc" };
    case "featured":
    default:
      return { orderby: "menu_order", order: "asc" };
  }
}

export function createWooCatalog(): CatalogDataSource {
  return {
    async listProducts(query: ListProductsQuery): Promise<ListProductsResult> {
      const { orderby, order } = sortToStoreParams(query.sort);
      const perPage = query.pageSize && query.pageSize > 0 ? query.pageSize : DEFAULT_PAGE_SIZE;
      const page = query.page && query.page > 0 ? query.page : 1;

      const res = await listStoreProducts({
        categorySlug: query.category,
        search: query.search,
        page,
        perPage,
        orderby,
        order,
      });

      const items: ProductSummary[] = res.items;
      return {
        items,
        total: res.total,
        page: res.page,
        pageCount: Math.max(1, res.totalPages),
      };
    },

    async getProductBySlug(slug) {
      return getStoreProductBySlug(slug);
    },

    async listCategories() {
      return listStoreCategories();
    },

    async getCategoryBySlug(slug) {
      return getStoreCategoryBySlug(slug);
    },
  };
}
