import { getCatalog } from "@/lib/catalog";
import { ProductAddonGridCard } from "./product-addon-grid-card";
import type { Product } from "@/lib/woo/types";

interface ProductAddonGridProps {
  currentProduct: Product;
  /**
   * Max number of recommendations to show.
   * Renders in a 2 → 3 → 4-column grid so ideally 3 or 4 products.
   * Defaults to 4.
   */
  max?: number;
}

/**
 * "Complete the Look" — multi-column portrait card grid. Server component.
 *
 * Fetches up to `max` products from the same primary category (or global
 * featured list if no category), then renders each as a portrait card with
 * a solid add-to-cart / quick-add button.
 *
 * Mobile  → 2 columns
 * Tablet  → 3 columns
 * Desktop → 4 columns
 */
export async function ProductAddonGrid({
  currentProduct,
  max = 4,
}: ProductAddonGridProps) {
  const catalog = getCatalog();
  const primaryCategory = currentProduct.categories[0];

  const { items: summaries } = primaryCategory
    ? await catalog.listProducts({
        category: primaryCategory.slug,
        pageSize: max + 2, // over-fetch so we can exclude current + have enough
        sort: "featured",
      })
    : await catalog.listProducts({ pageSize: max + 2, sort: "featured" });

  const addonSlugs = summaries
    .filter((p) => p.id !== currentProduct.id)
    .slice(0, max)
    .map((p) => p.slug);

  if (addonSlugs.length < 1) return null;

  // Fetch full Product objects in parallel — needed for variant pickers in QuickAddModal.
  const fullProducts = (
    await Promise.all(addonSlugs.map((slug) => catalog.getProductBySlug(slug)))
  ).filter((p): p is Product => p !== null);

  if (fullProducts.length < 1) return null;

  return (
    <section aria-label="Complete the Look" className="flex flex-col gap-4">
      {/* Section header */}
      <div className="flex items-center gap-2.5">
        <span className="h-px w-4 bg-gold shrink-0" aria-hidden />
        <p className="font-mono text-[9px] uppercase tracking-[0.45em] text-gold">
          Complete the Look
        </p>
        <span
          className="flex-1 h-px bg-border"
          aria-hidden
        />
      </div>

      {/* Horizontal scroll rail — each card is a fixed-width portrait */}
      <ul
        className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="list"
      >
        {fullProducts.map((product) => (
          <li key={product.id} className="w-28 sm:w-32 shrink-0">
            <ProductAddonGridCard product={product} />
          </li>
        ))}
      </ul>
    </section>
  );
}
