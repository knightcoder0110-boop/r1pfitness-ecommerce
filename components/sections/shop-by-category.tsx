import Link from "next/link";
import { getCatalog } from "@/lib/catalog";
import type { ProductCategory } from "@/lib/woo/types";
import { cn } from "@/lib/utils/cn";
import { CategoryCard } from "./category-card";

/**
 * Server component — renders a curated "Shop by category" section.
 *
 * Data source (Sprint A wiring):
 *   - source="auto"   → catalog.listCategories(), optionally sliced to `count`
 *   - source="manual" → catalog.listCategoriesBySlugs(slugs) (preserves order)
 *
 * Layout options:
 *   - "grid"     — responsive square-ish grid (2/3/4 cols). Safe default.
 *   - "bento"    — first tile spans 2×2 on lg+; ideal for 5-tile hero rows.
 *   - "scroller" — horizontal snap scroller (mobile-first; no overflow chrome).
 *
 * All content slots (eyebrow, title, description, CTA) are optional so the
 * same component can power hero ("SHOP THE COLLECTIONS") and subtle footer
 * category strips alike.
 *
 * Returns `null` when the resolved category list is empty, so the page can
 * reason about "does this section even render?" without extra guards.
 */

export interface ShopByCategorySectionProps {
  /** Editorial overline above the title. */
  eyebrow?: string;
  /** Display headline (required for a11y; always rendered as h2). */
  title: string;
  /** Optional supporting copy between the title and the grid. */
  description?: string;
  /** Right-aligned "View all" link next to the title. */
  viewAllHref?: string;
  viewAllLabel?: string;

  /**
   * `auto` — uses the full category list (optionally truncated by `count`).
   * `manual` — pulls a hand-picked set via `slugs`, preserving that order.
   */
  source?: "auto" | "manual";
  slugs?: string[];
  /** Max categories to render (auto mode). Default: show everything. */
  count?: number;

  /** Visual layout. Default: `grid`. */
  layout?: "grid" | "bento" | "scroller";
  /** Optional list of slugs to promote to the featured 2×2 slot (bento). */
  featuredSlugs?: string[];
  /** Override card tagline per slug (e.g. for seasonal campaigns). */
  taglines?: Record<string, string>;
  /** Hide item-count chip globally (e.g. on the homepage). */
  hideCounts?: boolean;

  /** Max-width container. Default: `max-w-[1440px]`. */
  className?: string;
  /** Section padding override (e.g. tighter on the homepage). */
  padding?: "default" | "tight" | "none";
}

export async function ShopByCategorySection({
  eyebrow,
  title,
  description,
  viewAllHref,
  viewAllLabel = "View all",
  source = "auto",
  slugs,
  count,
  layout = "grid",
  featuredSlugs,
  taglines,
  hideCounts = false,
  className,
  padding = "default",
}: ShopByCategorySectionProps) {
  const catalog = getCatalog();

  let categories: ProductCategory[];
  if (source === "manual" && slugs && slugs.length > 0) {
    categories = await catalog.listCategoriesBySlugs(slugs);
  } else {
    const all = await catalog.listCategories();
    categories = typeof count === "number" ? all.slice(0, count) : all;
  }

  if (categories.length === 0) return null;

  // Decide which card gets the "featured" flag (bento only)
  const featuredSet = new Set(featuredSlugs ?? []);
  const isFeatured = (slug: string, index: number): boolean => {
    if (layout !== "bento") return false;
    if (featuredSet.size > 0) return featuredSet.has(slug);
    // Default: first card is the featured slot.
    return index === 0;
  };

  return (
    <section
      aria-label={title}
      className={cn(
        padding === "default" && "py-16 sm:py-20 lg:py-24",
        padding === "tight" && "py-10 sm:py-12",
        padding === "none" && "py-0",
      )}
    >
      <div className={cn("mx-auto px-4 sm:px-6 lg:px-8", className ?? "max-w-[1440px]")}>
        {/* ── Header ─────────────────────────────────────────────── */}
        <header className="flex items-end justify-between gap-6 mb-8 sm:mb-10 lg:mb-12">
          <div className="flex flex-col gap-3 max-w-2xl">
            {eyebrow && (
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-gold">
                {eyebrow}
              </span>
            )}
            <h2 className="font-display uppercase tracking-[0.04em] text-text text-[clamp(1.75rem,4vw,3rem)] leading-[0.95]">
              {title}
            </h2>
            {description && (
              <p className="text-muted text-sm sm:text-base leading-relaxed mt-1">{description}</p>
            )}
          </div>

          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="hidden sm:inline-flex shrink-0 items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-subtle hover:text-gold transition-colors"
            >
              {viewAllLabel}
              <span aria-hidden>→</span>
            </Link>
          )}
        </header>

        {/* ── Body ───────────────────────────────────────────────── */}
        {layout === "scroller" ? (
          <div
            className="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory scroll-px-4 sm:scroll-px-6 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="list"
          >
            {categories.map((category, i) => (
              <div key={category.id} role="listitem">
                <CategoryCard
                  category={category}
                  index={i}
                  variant="scroller"
                  tagline={taglines?.[category.slug]}
                  showCount={!hideCounts}
                />
              </div>
            ))}
          </div>
        ) : layout === "bento" ? (
          <div
            className={cn(
              "grid gap-3 sm:gap-4",
              "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
              // Taller rows on lg so featured tile fills neatly
              "lg:auto-rows-[minmax(260px,1fr)]",
            )}
          >
            {categories.map((category, i) => (
              <div
                key={category.id}
                className={cn(
                  isFeatured(category.slug, i) &&
                    "col-span-2 row-span-2 lg:col-span-2 lg:row-span-2",
                )}
              >
                <CategoryCard
                  category={category}
                  index={i}
                  featured={isFeatured(category.slug, i)}
                  variant="grid"
                  tagline={taglines?.[category.slug]}
                  showCount={!hideCounts}
                  priority={i === 0}
                />
              </div>
            ))}
          </div>
        ) : (
          <div
            className={cn(
              "grid gap-3 sm:gap-4",
              "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
            )}
          >
            {categories.map((category, i) => (
              <CategoryCard
                key={category.id}
                category={category}
                index={i}
                variant="portrait"
                tagline={taglines?.[category.slug]}
                showCount={!hideCounts}
                priority={i < 2}
              />
            ))}
          </div>
        )}

        {/* Mobile "View all" (header link hidden < sm) */}
        {viewAllHref && (
          <div className="mt-8 flex sm:hidden justify-center">
            <Link
              href={viewAllHref}
              className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-subtle hover:text-gold transition-colors"
            >
              {viewAllLabel}
              <span aria-hidden>→</span>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
