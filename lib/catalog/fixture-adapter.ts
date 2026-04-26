import type { ProductCategory, ProductCategoryNode, ProductSummary } from "@/lib/woo/types";
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
        categories,
        search,
        sort = "featured",
        page = 1,
        pageSize = DEFAULT_PAGE_SIZE,
        sizes,
        colors,
        priceMin,
        priceMax,
        inStock,
        slugs,
        ids,
        tag,
        tags,
        featured,
        onSale,
      } = query;

      let items = getAllProducts();

      if (category) {
        items = items.filter((p) => p.categories.some((c) => c.slug === category));
      }

      if (categories && categories.length > 0) {
        const catSet = new Set(categories);
        items = items.filter((p) => p.categories.some((c) => catSet.has(c.slug)));
      }

      if (slugs && slugs.length > 0) {
        const slugSet = new Set(slugs);
        items = items.filter((p) => slugSet.has(p.slug));
      }

      if (ids && ids.length > 0) {
        const idSet = new Set(ids);
        items = items.filter((p) => idSet.has(p.id));
      }

      if (tag) {
        items = items.filter((p) => p.tags.includes(tag));
      }

      if (tags && tags.length > 0) {
        const tagSet = new Set(tags);
        items = items.filter((p) => p.tags.some((t) => tagSet.has(t)));
      }

      if (featured) {
        // Fixtures don't carry a native featured flag — treat "is_limited"
        // as a proxy so the filter has meaningful dev output.
        items = items.filter((p) => p.meta.isLimited === true);
      }

      if (onSale) {
        items = items.filter(
          (p) => p.compareAtPrice !== undefined && p.compareAtPrice.amount > p.price.amount,
        );
      }

      if (search) {
        const needle = search.toLowerCase();
        items = items.filter(
          (p) =>
            p.name.toLowerCase().includes(needle) ||
            p.tags.some((t) => t.toLowerCase().includes(needle)),
        );
      }

      if (sizes && sizes.length > 0) {
        const sizeSet = new Set(sizes.map((s) => s.toLowerCase()));
        items = items.filter((p) => {
          const attr = p.attributes.find((a) => a.id === "pa_size");
          return attr?.options.some((o) => sizeSet.has(o.toLowerCase()));
        });
      }

      if (colors && colors.length > 0) {
        const colorSet = new Set(colors.map((c) => c.toLowerCase()));
        items = items.filter((p) => {
          const attr = p.attributes.find((a) => a.id === "pa_color");
          return attr?.options.some((o) => colorSet.has(o.toLowerCase()));
        });
      }

      if (priceMin !== undefined) {
        items = items.filter((p) => p.price.amount >= priceMin);
      }

      if (priceMax !== undefined) {
        items = items.filter((p) => p.price.amount <= priceMax);
      }

      if (inStock) {
        items = items.filter((p) => p.stockStatus === "in_stock" || p.stockStatus === "low_stock");
      }

      let summaries = items.map(toSummary);

      // When caller supplied an explicit slug list, preserve their order.
      if (slugs && slugs.length > 0) {
        const order = new Map(slugs.map((s, i) => [s, i]));
        summaries.sort(
          (a, b) => (order.get(a.slug) ?? 0) - (order.get(b.slug) ?? 0),
        );
      } else {
        summaries = sortSummaries(summaries, sort);
      }

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
      // Fixtures don't benefit from the productId hint — single in-memory lookup.
      return findProductBySlug(slug) ?? null;
    },

    async listCategories() {
      return FIXTURE_CATEGORIES;
    },

    async getCategoryBySlug(slug) {
      return findCategoryBySlug(slug) ?? null;
    },

    async listCategoriesBySlugs(slugs: string[]) {
      if (slugs.length === 0) return [];
      const bySlug = new Map(FIXTURE_CATEGORIES.map((c) => [c.slug, c]));
      return slugs
        .map((s) => bySlug.get(s))
        .filter((c): c is ProductCategory => c !== undefined);
    },

    async listCategoryTree() {
      // Fixtures are flat today — every category is a root node.
      return FIXTURE_CATEGORIES.map<ProductCategoryNode>((c) => ({
        ...c,
        children: [],
      }));
    },
  };
}
