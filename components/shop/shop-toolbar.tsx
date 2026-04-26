import { CategoryChips, FilterSidebar, SortSelect } from "@/components/shop";
import { cn } from "@/lib/utils/cn";

/**
 * ShopToolbar — category chips plus the filter/sort controls row for
 * /shop and /shop/[category].
 *
 * Keeps the listing chrome visually consistent across the catalog so the
 * user always lands on the same affordances.
 */
export interface ShopToolbarProps {
  /** null = "All" chip active; slug = that category chip active. */
  activeSlug: string | null;
  /**
   * The current sort value forwarded to category chips so switching categories
   * preserves the user's sort preference.
   */
  currentSort?: string;
  className?: string;
}

export function ShopToolbar({ activeSlug, currentSort, className }: ShopToolbarProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <CategoryChips activeSlug={activeSlug} currentSort={currentSort} />
      <div className="flex items-center justify-between gap-4 border-t border-border/60 pt-4">
        <FilterSidebar className="shrink-0" />
        <SortSelect className="shrink-0" />
      </div>
    </div>
  );
}
