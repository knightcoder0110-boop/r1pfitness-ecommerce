import { getCatalog } from "@/lib/catalog";
import { ProductAddonCard } from "./product-addon-card";
import type { Product } from "@/lib/woo/types";

interface ProductAddonsProps {
  currentProduct: Product;
}

/**
 * "Complete the Look" add-on rail — server component.
 *
 * 1. Lists up to 5 products from the same primary category.
 * 2. Excludes the current product, takes up to 3.
 * 3. Fetches the full Product for each so ProductAddonCard can render
 *    a proper variation picker and add the correct variant to the cart.
 */
export async function ProductAddons({ currentProduct }: ProductAddonsProps) {
  const catalog = getCatalog();
  const primaryCategory = currentProduct.categories[0];

  const { items: summaries } = primaryCategory
    ? await catalog.listProducts({
        category: primaryCategory.slug,
        pageSize: 6,
        sort: "featured",
      })
    : await catalog.listProducts({ pageSize: 6, sort: "featured" });

  const addonSlugs = summaries
    .filter((p) => p.id !== currentProduct.id)
    .slice(0, 3)
    .map((p) => p.slug);

  if (addonSlugs.length < 1) return null;

  // Fetch full Product objects in parallel so we get attributes + variations.
  const fullProducts = (
    await Promise.all(addonSlugs.map((slug) => catalog.getProductBySlug(slug)))
  ).filter((p): p is Product => p !== null);

  if (fullProducts.length < 1) return null;

  return (
    <div className="border border-border rounded-sm p-4 flex flex-col gap-3 bg-surface-1/50">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="h-px w-4 bg-gold" aria-hidden="true" />
        <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-gold">
          Complete the Look
        </p>
      </div>

      {/* Add-on cards — fixed height so the rail never pushes Add to Cart off-screen */}
      <ul className="flex flex-col gap-2 max-h-[280px] overflow-y-auto [scrollbar-width:thin] [scrollbar-color:theme(colors.border)_transparent] pr-0.5">
        {fullProducts.map((product) => (
          <li key={product.id}>
            <ProductAddonCard product={product} />
          </li>
        ))}
      </ul>
    </div>
  );
}
