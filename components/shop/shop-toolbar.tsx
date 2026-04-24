import { CategoryChips, SearchBar, SortSelect } from "@/components/shop";
import { cn } from "@/lib/utils/cn";

/**
 * ShopToolbar — unified controls row for /shop and /shop/[category].
 *
 * Keeps chips + search + sort visually consistent across listings so the
 * user always lands on the same affordances. Composed from existing
 * primitives; no new behaviour introduced here.
 */
export interface ShopToolbarProps {
  /** null = "All" chip active; slug = that category chip active. */
  activeSlug: string | null;
  /**
   * The current sort value forwarded to category chips so switching categories
   * preserves the user's sort preference.
   */
  currentSort?: string;
  /** Show the free-text search box (shop only by default). */
  showSearch?: boolean;
  className?: string;
}

export function ShopToolbar({ activeSlug, currentSort, showSearch = false, className }: ShopToolbarProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <CategoryChips activeSlug={activeSlug} currentSort={currentSort} />
      <div
        className={cn(
          "flex flex-col gap-3",
          showSearch
            ? "sm:flex-row sm:items-center sm:justify-between"
            : "sm:flex-row sm:items-center sm:justify-end",
        )}
      >
        {showSearch ? <SearchBar className="sm:max-w-xs" /> : null}
        <SortSelect />
      </div>
    </div>
  );
}
