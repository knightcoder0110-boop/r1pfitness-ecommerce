import Link from "next/link";
import { getCatalog } from "@/lib/catalog";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { cn } from "@/lib/utils/cn";

/**
 * Gradient palettes used as fallbacks when a category has no image.
 * One per category slot, cycling if there are more categories than palettes.
 */
const CATEGORY_GRADIENTS = [
  "from-stone-900 to-stone-700",   // Tees
  "from-zinc-900 to-zinc-700",     // Hoodies
  "from-neutral-900 to-stone-800", // Caps
  "from-gray-900 to-gray-700",     // Bottoms
  "from-slate-900 to-slate-700",   // Activewear
  "from-zinc-900 to-neutral-800",  // Accessories
];

/**
 * Shop-by-category visual grid.
 *
 * Fetches live categories from WooCommerce. Renders one card per category with:
 * – Category image (or gradient placeholder if none)
 * – Overlay with category name + product count
 * – Gold rule hover accent
 *
 * Grid: 2 cols (mobile) → 3 cols (sm) → 6 cols (lg, compact strip)
 * OR 2x3 grid (default). Layout controlled by `compact` prop.
 *
 * Server component — zero client JS.
 */
export interface CategoryGridProps {
  /**
   * If true, render all categories in a single narrow-height strip (6 cols desktop).
   * If false (default), render a 2x3 card grid with taller aspect ratios.
   */
  compact?: boolean;
  className?: string;
}

export async function CategoryGrid({ compact = false, className }: CategoryGridProps) {
  const catalog = getCatalog();
  const categories = await catalog.listCategories();

  // Filter out the "uncategorized" placeholder WooCommerce adds by default
  const filtered = categories.filter((c) => c.slug !== "uncategorized");

  if (filtered.length === 0) return null;

  return (
    <Section
      aria-labelledby="category-grid-heading"
      spacing="md"
      className={className}
    >
      <SectionHeader
        id="category-grid-heading"
        eyebrow="Collections"
        title="Shop by category"
        align="center"
      />

        {/* Grid */}
        <ul
          className={cn(
            "grid gap-3",
            compact
              ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"
              : "grid-cols-2 sm:grid-cols-3",
          )}
          role="list"
        >
          {filtered.map((cat, i) => (
            <li key={cat.id}>
              <Link
                href={`/shop?category=${cat.slug}`}
                className={cn(
                  "group relative flex overflow-hidden bg-surface-2",
                  compact ? "aspect-square" : "aspect-card",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
                )}
                aria-label={`Shop ${cat.name}`}
              >
                {/* Background: gradient placeholder */}
                <div
                  className={cn(
                    "absolute inset-0 bg-gradient-to-br",
                    CATEGORY_GRADIENTS[i % CATEGORY_GRADIENTS.length],
                  )}
                  aria-hidden="true"
                />

                {/* Dark scrim */}
                <div
                  className="absolute inset-0 bg-gradient-to-t from-bg/90 via-bg/30 to-transparent"
                  aria-hidden="true"
                />

                {/* Gold bottom rule — grows on hover */}
                <div
                  className="absolute bottom-0 left-0 h-[2px] w-0 bg-gold transition-all duration-300 group-hover:w-full"
                  aria-hidden="true"
                />

                {/* Text overlay */}
                <div className="relative mt-auto w-full p-4">
                  <p className="font-display text-xl sm:text-2xl leading-none tracking-widest text-white">
                    {cat.name.toUpperCase()}
                  </p>
                  <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.3em] text-gold/80">
                    Shop now
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
    </Section>
  );
}
