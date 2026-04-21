import { getCatalog } from "@/lib/catalog";
import { ProductCard } from "./product-card";
import type { Product } from "@/lib/woo/types";

export interface RelatedProductsProps {
  /** The product currently being viewed — excluded from the results. */
  current: Product;
  /** How many related items to show. Defaults to 4. */
  limit?: number;
}

/**
 * "You might also like" rail shown at the bottom of a PDP.
 *
 * Server component — fetches products from the same primary category as the
 * current product, excluding the current one. Falls back to featured products
 * when the product has no category or the category has too few siblings.
 */
export async function RelatedProducts({ current, limit = 4 }: RelatedProductsProps) {
  const catalog = getCatalog();
  const primaryCategory = current.categories[0];

  // Fetch from same category first, fall back to featured.
  const { items } = primaryCategory
    ? await catalog.listProducts({
        category: primaryCategory.slug,
        pageSize: limit + 1,
        sort: "featured",
      })
    : await catalog.listProducts({ pageSize: limit + 1, sort: "featured" });

  const related = items.filter((p) => p.id !== current.id).slice(0, limit);
  if (related.length === 0) return null;

  return (
    <section
      aria-labelledby="related-heading"
      className="border-t border-border pt-10 mt-12"
    >
      <header className="mb-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-muted">
          More from the drop
        </p>
        <h2
          id="related-heading"
          className="mt-1 font-display text-2xl sm:text-3xl tracking-wider text-text"
        >
          You Might Also Like
        </h2>
      </header>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
        {related.map((p) => (
          <li key={p.id}>
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
    </section>
  );
}
