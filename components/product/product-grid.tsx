import { cn } from "@/lib/utils/cn";
import type { ProductSummary } from "@/lib/woo/types";
import { ProductCard } from "./product-card";

export interface ProductGridProps {
  items: ProductSummary[];
  /**
   * Controls the maximum column count and the breakpoint scale.
   *
   * `4` — Product rail mode: 2 cols on mobile → 4 cols on desktop (lg+).
   *       Use when showing exactly 4 featured/highlighted items.
   *
   * `5` — Full listing mode: 2 → 3 → 4 → 5 cols across breakpoints.
   *       Used on /shop, /search, /collections.
   *
   * Defaults to `5`.
   */
  columns?: 4 | 5;
  className?: string;
}

/**
 * Responsive product grid. First four items get image-priority so the
 * above-the-fold row loads eagerly.
 */
export function ProductGrid({ items, columns = 5, className }: ProductGridProps) {
  if (items.length === 0) {
    return (
      <div className="flex min-h-[240px] items-center justify-center rounded-sm border border-dashed border-border-strong">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-subtle">
          No products match these filters
        </p>
      </div>
    );
  }

  return (
    <ul
      className={cn(
        "grid gap-x-5 gap-y-12",
        columns === 4
          ? "grid-cols-2 lg:grid-cols-4"
          : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
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
