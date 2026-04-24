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

      // Attribute filters are not directly supported by the Woo Store API's
      // /products endpoint. When filters are active we fetch a larger batch
      // and apply them in-process. Once Meilisearch is provisioned (Sprint 4),
      // filtered queries will bypass this adapter entirely.
      const hasFilters =
        (query.sizes && query.sizes.length > 0) ||
        (query.colors && query.colors.length > 0) ||
        query.priceMin !== undefined ||
        query.priceMax !== undefined ||
        query.inStock;

      const fetchPerPage = hasFilters ? Math.min(perPage * 4, 48) : perPage;

      const res = await listStoreProducts({
        categorySlug: query.category,
        search: query.search,
        page: hasFilters ? 1 : page,
        perPage: fetchPerPage,
        orderby,
        order,
      });

      let items: ProductSummary[] = res.items;

      if (hasFilters) {
        if (query.sizes && query.sizes.length > 0) {
          const sizeSet = new Set(query.sizes.map((s) => s.toLowerCase()));
          items = items.filter((p) =>
            p.sizeOptions?.some((s) => sizeSet.has(s.toLowerCase())),
          );
        }
        if (query.colors && query.colors.length > 0) {
          const colorSet = new Set(query.colors.map((c) => c.toLowerCase()));
          items = items.filter((p) =>
            p.colorOptions?.some((c) => colorSet.has(c.toLowerCase())),
          );
        }
        if (query.priceMin !== undefined) {
          items = items.filter((p) => p.price.amount >= query.priceMin!);
        }
        if (query.priceMax !== undefined) {
          items = items.filter((p) => p.price.amount <= query.priceMax!);
        }
        if (query.inStock) {
          items = items.filter(
            (p) => p.stockStatus === "in_stock" || p.stockStatus === "low_stock",
          );
        }

        // Re-paginate the filtered result.
        const total = items.length;
        const pageCount = Math.max(1, Math.ceil(total / perPage));
        const safePage = Math.min(Math.max(1, page), pageCount);
        const start = (safePage - 1) * perPage;
        return {
          items: items.slice(start, start + perPage),
          total,
          page: safePage,
          pageCount,
        };
      }

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
