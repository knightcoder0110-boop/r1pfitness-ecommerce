import { cn } from "@/lib/utils/cn";
import type { ProductSummary } from "@/lib/woo/types";
import { ProductCard } from "./product-card";

export interface ProductGridProps {
  items: ProductSummary[];
  className?: string;
}

/**
 * Responsive product grid. First four items get image-priority so the
 * above-the-fold row loads eagerly.
 */
export function ProductGrid({ items, className }: ProductGridProps) {
  if (items.length === 0) {
    return (
      <div className="flex min-h-[240px] items-center justify-center rounded-sm border border-dashed border-text/20">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-text/40">
          No products match these filters
        </p>
      </div>
    );
  }

  return (
    <ul
      className={cn(
        "grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4",
        className,
      )}
    >
      {items.map((p, i) => (
        <li key={p.id}>
          <ProductCard product={p} priority={i < 4} />
        </li>
      ))}
    </ul>
  );
}
