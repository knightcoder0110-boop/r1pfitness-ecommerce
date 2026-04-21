import type { ProductSummary } from "@/lib/woo/types";
import type { CatalogDataSource, ListProductsQuery, ListProductsResult } from "./types";
import {
  FIXTURE_CATEGORIES,
  findCategoryBySlug,
  findProductBySlug,
  getAllProducts,
  toSummary,
} from "./fixtures";

/**
 * In-memory catalog adapter backed by hand-authored fixtures.
 *
 * Implements `CatalogDataSource` so it's swappable for the Woo-backed adapter
 * in Phase 1b. Every method is deterministic, synchronous under the hood, and
 * async on the surface so call sites look identical for the real adapter.
 */

const DEFAULT_PAGE_SIZE = 12;

function sortSummaries(items: ProductSummary[], sort: ListProductsQuery["sort"]): ProductSummary[] {
  const copy = [...items];
  switch (sort) {
    case "price-asc":
      copy.sort((a, b) => a.price.amount - b.price.amount);
      break;
    case "price-desc":
      copy.sort((a, b) => b.price.amount - a.price.amount);
      break;
    case "newest":
      // Fixtures don't have a timestamp yet; reverse the featured order as a
      // stand-in. Real adapter will sort by `date_created`.
      copy.reverse();
      break;
    case "featured":
    default:
      break;
  }
  return copy;
}

export function createFixtureCatalog(): CatalogDataSource {
  return {
    async listProducts(query) {
      const {
        category,
        search,
        sort = "featured",
        page = 1,
        pageSize = DEFAULT_PAGE_SIZE,
      } = query;

      let items = getAllProducts();

      if (category) {
        items = items.filter((p) => p.categories.some((c) => c.slug === category));
      }

      if (search) {
        const needle = search.toLowerCase();
        items = items.filter(
          (p) =>
            p.name.toLowerCase().includes(needle) ||
            p.tags.some((t) => t.toLowerCase().includes(needle)),
        );
      }

      const summaries = sortSummaries(items.map(toSummary), sort);

      const total = summaries.length;
      const pageCount = Math.max(1, Math.ceil(total / pageSize));
      const safePage = Math.min(Math.max(1, page), pageCount);
      const start = (safePage - 1) * pageSize;
      const pageItems = summaries.slice(start, start + pageSize);

      const result: ListProductsResult = {
        items: pageItems,
        total,
        page: safePage,
        pageCount,
      };
      return result;
    },

    async getProductBySlug(slug) {
      return findProductBySlug(slug) ?? null;
    },

    async listCategories() {
      return FIXTURE_CATEGORIES;
    },

    async getCategoryBySlug(slug) {
      return findCategoryBySlug(slug) ?? null;
    },
  };
}
