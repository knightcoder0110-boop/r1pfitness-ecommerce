import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { getCatalog } from "@/lib/catalog";
import { DEFAULT_SORT } from "@/lib/shop";
import { cn } from "@/lib/utils/cn";

/**
 * Maps a WooCommerce category slug to a user-facing display override.
 * Woo slugs listed here are hidden from the chip row and replaced by the
 * virtual entry so users see the brand-level label + URL.
 */
const CATEGORY_DISPLAY_OVERRIDES: Record<
  string,
  { label: string; href: string; activeWhen: string[] }
> = {
  /**
   * The WooCommerce category "bundles" (id=449) is the backing store for the
   * mystery-box drop. Customers should see "Mystery Boxes" at /shop/mystery-boxes,
   * not the internal "Bundles" slug.
   */
  bundles: {
    label: "Mystery Boxes",
    href: ROUTES.category("mystery-boxes"),
    activeWhen: ["mystery-boxes", "bundles"],
  },
};

interface CategoryChipsProps {
  /** Currently active category slug, or null when on /shop (All). */
  activeSlug: string | null;
  /**
   * The current sort value. When non-default, it is preserved in the chip
   * link so switching categories doesn't reset the user's sort preference.
   */
  currentSort?: string;
  className?: string;
}

/**
 * Server component — renders a horizontally-scrollable row of category
 * filter chips. Active chip is visually distinct; "All" deep-links back to
 * `/shop`. Chips intentionally reset `?page` so users don't hit an empty
 * page after switching categories.
 */
export async function CategoryChips({ activeSlug, currentSort, className }: CategoryChipsProps) {
  const categories = await getCatalog().listCategories();
  if (categories.length === 0) return null;

  // Include sort in links only when it differs from the default — keeps URLs
  // clean while preserving the user's active sort when switching categories.
  const sortSuffix =
    currentSort && currentSort !== DEFAULT_SORT ? `?sort=${currentSort}` : "";

  const items: { key: string; label: string; href: string; active: boolean }[] = [
    {
      key: "all",
      label: "All",
      href: `${ROUTES.shop}${sortSuffix}`,
      active: activeSlug === null,
    },
    ...categories.map((c) => {
      const override = CATEGORY_DISPLAY_OVERRIDES[c.slug];
      return {
        key: c.slug,
        label: override ? override.label : c.name,
        href: override ? `${override.href}${sortSuffix}` : `${ROUTES.category(c.slug)}${sortSuffix}`,
        active: override
          ? override.activeWhen.includes(activeSlug ?? "")
          : c.slug === activeSlug,
      };
    }),
  ];

  return (
    <nav aria-label="Product categories" className={cn("relative", className)}>
      <ul
        className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => (
          <li key={item.key} className="shrink-0">
            <Link
              href={item.href}
              aria-current={item.active ? "page" : undefined}
              className={cn(
                "inline-flex items-center border px-4 py-2 font-mono text-xs uppercase tracking-[0.25em] transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                item.active
                  ? "border-text bg-text text-bg"
                  : "border-border text-muted hover:border-border-strong hover:text-text",
              )}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
