import "server-only";

import {
  getStoreCategoryBySlug,
  getStoreProductBySlug,
  listStoreCategories,
  listStoreCategoriesBySlugs,
  listStoreProducts,
  listStoreTagIdsBySlugs,
} from "@/lib/woo/products";
import type { ProductCategory, ProductCategoryNode, ProductSummary } from "@/lib/woo/types";
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

/** Turn a flat list of categories into a nested tree via parentId. */
function buildCategoryTree(flat: ProductCategory[]): ProductCategoryNode[] {
  const byId = new Map<string, ProductCategoryNode>();
  for (const c of flat) byId.set(c.id, { ...c, children: [] });

  const roots: ProductCategoryNode[] = [];
  for (const node of byId.values()) {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
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
      const hasPostFilters =
        (query.sizes && query.sizes.length > 0) ||
        (query.colors && query.colors.length > 0) ||
        query.priceMin !== undefined ||
        query.priceMax !== undefined ||
        query.inStock;

      const fetchPerPage = hasPostFilters ? 100 : perPage;

      // ── Resolve all category slugs → numeric IDs ──
      // The Woo Store API `category` param accepts numeric IDs universally.
      // Slug support exists on Woo 7.x+ but is silently ignored on older
      // installs — passing a non-numeric value causes the filter to be skipped
      // and ALL products are returned. We always resolve to IDs so filtering
      // is reliable regardless of WooCommerce version.
      //
      // Both the single `query.category` and the plural `query.categories[]`
      // paths now go through ID resolution. Results are de-duped and merged.
      const slugsToResolve: string[] = [
        ...(query.category ? [query.category] : []),
        ...(query.categories ?? []),
      ];
      const resolvedCategories =
        slugsToResolve.length > 0
          ? await listStoreCategoriesBySlugs(slugsToResolve)
          : [];
      const categoryIds =
        resolvedCategories.length > 0
          ? resolvedCategories.map((c) => c.id)
          : undefined;

      const tagIds =
        query.tags && query.tags.length > 0
          ? await listStoreTagIdsBySlugs(query.tags)
          : undefined;

      // If the caller asked for slugs[] or ids[], run those as Woo queries.
      // Woo's `slug` param accepts only ONE slug, so for multi-slug we
      // parallel-fetch and merge (cheaper than fetching everything).
      if (query.slugs && query.slugs.length > 0) {
        const results = await Promise.all(
          query.slugs.map((slug) =>
            listStoreProducts({
              slug,
              perPage: 1,
              orderby,
              order,
            }).then((r) => r.items[0]).catch(() => undefined),
          ),
        );
        const items = results.filter(
          (r): r is ProductSummary => r !== undefined,
        );
        return {
          items,
          total: items.length,
          page: 1,
          pageCount: 1,
        };
      }

      const res = await listStoreProducts({
        categoryIds,
        includeIds: query.ids,
        tagSlug: query.tag,
        tagIds,
        featured: query.featured,
        onSale: query.onSale,
        search: query.search,
        page: hasPostFilters ? 1 : page,
        perPage: fetchPerPage,
        orderby,
        order,
      });

      let items: ProductSummary[] = res.items;

      if (hasPostFilters) {
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

    async getProductBySlug(slug, hints) {
      return getStoreProductBySlug(slug, hints);
    },

    async listCategories() {
      return listStoreCategories();
    },

    async getCategoryBySlug(slug) {
      return getStoreCategoryBySlug(slug);
    },

    async listCategoriesBySlugs(slugs: string[]) {
      if (slugs.length === 0) return [];
      const resolved = await listStoreCategoriesBySlugs(slugs);
      // Preserve caller order (Woo returns by its own ordering).
      const bySlug = new Map(resolved.map((c) => [c.slug, c]));
      return slugs
        .map((s) => bySlug.get(s))
        .filter((c): c is ProductCategory => c !== undefined);
    },

    async listCategoryTree() {
      const flat = await listStoreCategories();
      return buildCategoryTree(flat);
    },
  };
}
