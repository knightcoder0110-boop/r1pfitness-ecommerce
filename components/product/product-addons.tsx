import { getCatalog } from "@/lib/catalog";
import { ProductAddonCard } from "./product-addon-card";
import type { Product } from "@/lib/woo/types";

interface ProductAddonsProps {
  currentProduct: Product;
}

/**
 * "Complete the Look" add-on rail — server component.
 *
 * Fetches up to 3 products from the same primary category (excluding the
 * current product). Each product renders as a compact `ProductAddonCard`.
 * Returns null if there aren't at least 2 related products.
 */
export async function ProductAddons({ currentProduct }: ProductAddonsProps) {
  const catalog = getCatalog();
  const primaryCategory = currentProduct.categories[0];

  const { items } = primaryCategory
    ? await catalog.listProducts({
        category: primaryCategory.slug,
        pageSize: 6,
        sort: "featured",
      })
    : await catalog.listProducts({ pageSize: 6, sort: "featured" });

  const addons = items
    .filter((p) => p.id !== currentProduct.id)
    .slice(0, 3);

  if (addons.length < 1) return null;

  return (
    <div className="border border-border rounded-sm p-4 flex flex-col gap-3 bg-surface-1/50">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="h-px w-4 bg-gold" aria-hidden="true" />
        <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-gold">
          Complete the Look
        </p>
      </div>

      {/* Add-on cards */}
      <ul className="flex flex-col gap-2">
        {addons.map((product) => (
          <li key={product.id}>
            <ProductAddonCard product={product} />
          </li>
        ))}
      </ul>
    </div>
  );
}
