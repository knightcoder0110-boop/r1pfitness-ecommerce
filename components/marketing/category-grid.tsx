import Link from "next/link";
import { getCatalog } from "@/lib/catalog";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";

/* ─── Static enrichment map ──────────────────────────────────────────────
   WooCommerce categories only carry id/name/slug. We enrich each slot with
   a gradient, a short tagline, and an optional product-count badge so the
   grid looks editorial even before real images are wired.

   Keys are lowercase WooCommerce category slugs. The fallback kicks in for
   any category that isn't explicitly listed here.
──────────────────────────────────────────────────────────────────────────── */
const CATEGORY_META: Record<
  string,
  { gradient: string; tagline: string; dark?: boolean }
> = {
  tees: {
    gradient: "linear-gradient(155deg,#1c0e00 0%,#3d2000 100%)",
    tagline: "Vintage wash. Limited runs.",
  },
  hoodies: {
    gradient: "linear-gradient(155deg,#06080f 0%,#0d1b30 100%)",
    tagline: "Heavyweight comfort.",
  },
  bottoms: {
    gradient: "linear-gradient(155deg,#090f06 0%,#142208 100%)",
    tagline: "Train hard. Look clean.",
  },
  caps: {
    gradient: "linear-gradient(155deg,#15090a 0%,#2e1314 100%)",
    tagline: "Represent everywhere.",
  },
  accessories: {
    gradient: "linear-gradient(155deg,#08080f 0%,#0f1428 100%)",
    tagline: "Finish the fit.",
  },
  activewear: {
    gradient: "linear-gradient(155deg,#0d0d0d 0%,#1c1a10 100%)",
    tagline: "Built for performance.",
  },
};

const FALLBACK_GRADIENTS = [
  "linear-gradient(155deg,#1c0e00 0%,#3d2000 100%)",
  "linear-gradient(155deg,#06080f 0%,#0d1b30 100%)",
  "linear-gradient(155deg,#090f06 0%,#142208 100%)",
  "linear-gradient(155deg,#15090a 0%,#2e1314 100%)",
  "linear-gradient(155deg,#08080f 0%,#0f1428 100%)",
  "linear-gradient(155deg,#0d0d0d 0%,#1c1c1c 100%)",
];

/* ─── Noise texture SVG (inline, same as CategoryScroller) ──────────────── */
const NOISE_STYLE = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
  backgroundSize: "200px 200px",
} as const;

/* ─── Component ──────────────────────────────────────────────────────────── */
export interface CategoryGridProps {
  className?: string;
}

/**
 * Bento-style shop-by-category grid.
 *
 * Mirrors the Shopify theme's `category-grid.liquid` bento layout:
 *
 *  Desktop (lg+):
 *  ┌─────────────────┬──────┬──────┐
 *  │                 │  B   │  C   │
 *  │   A (featured)  ├──────┼──────┤
 *  │   (2 cols × 2)  │  D   │  E   │
 *  └─────────────────┴──────┴──────┘
 *  If 6 categories: adds a full-width strip at the bottom.
 *
 *  Tablet (sm–lg): 2-col equal grid.
 *  Mobile: 2-col grid, featured card collapses to normal height.
 *
 * Card anatomy:
 *  - Rich gradient bg (from static map, cycling fallback)
 *  - Film-grain noise overlay
 *  - Faint watermark letter (top-right)
 *  - Gold bottom rule on hover (slides from left)
 *  - `title → tagline → arrow circle` body row
 *  - Arrow circle gold-fills on hover (exact Shopify theme treatment)
 *
 * Data: WooCommerce categories via getCatalog().listCategories().
 * Server component — zero client JS.
 */
export async function CategoryGrid({ className }: CategoryGridProps) {
  const catalog = getCatalog();
  const categories = await catalog.listCategories();
  const filtered = categories.filter((c) => c.slug !== "uncategorized");

  if (filtered.length === 0) return null;

  // Cap at 5 cards for clean bento: 1 featured (2×2) + 4 regular
  const display = filtered.slice(0, 5);
  const [featured, ...rest] = display;

  return (
    <Section
      aria-labelledby="cat-grid-heading"
      spacing="md"
      bordered="y"
      className={className}
    >
      <SectionHeader
        id="cat-grid-heading"
        eyebrow="Collections"
        title="Shop by category"
        viewAllHref={ROUTES.collections}
        align="center"
      />

      {/*
        ── Bento grid ───────────────────────────────────────────────────────
        lg: 4 columns. Card 1 spans col 1-2, row 1-2 (the hero).
            Remaining 4 cards fill the 2×2 right quadrant.
        sm: 2 equal columns — bento collapses to flat grid.
        xs: 2 equal columns.
      */}
      <ul
        className={cn(
          "grid gap-3",
          /* Desktop: 4-col bento */
          "lg:grid-cols-4",
          /* Tablet: 2-col equal */
          "sm:grid-cols-2",
          /* Mobile: 2-col equal */
          "grid-cols-2",
        )}
        role="list"
      >
        {/* ── Featured (hero) card ──────────────────────────────── */}
        {featured && (
          <li className="lg:col-span-2 lg:row-span-2">
            <CategoryCard
              cat={featured}
              index={0}
              featured
            />
          </li>
        )}

        {/* ── Regular cards ─────────────────────────────────────── */}
        {rest.map((cat, i) => (
          <li key={cat.id}>
            <CategoryCard cat={cat} index={i + 1} featured={false} />
          </li>
        ))}
      </ul>
    </Section>
  );
}

/* ─── Internal card ──────────────────────────────────────────────────────── */
function CategoryCard({
  cat,
  index,
  featured,
}: {
  cat: { id: string; name: string; slug: string };
  index: number;
  featured: boolean;
}) {
  const meta = CATEGORY_META[cat.slug.toLowerCase()];
  const gradient = meta?.gradient ?? FALLBACK_GRADIENTS[index % FALLBACK_GRADIENTS.length];
  const tagline = meta?.tagline;

  return (
    <Link
      href={`/shop?category=${cat.slug}`}
      className={cn(
        "group relative flex flex-col overflow-hidden",
        "border border-white/[0.07] transition-[border-color,box-shadow,transform] duration-300 ease-out",
        "hover:border-gold/50 hover:-translate-y-[3px]",
        "hover:shadow-[0_16px_40px_rgba(0,0,0,0.55),0_0_0_1px_rgba(201,168,76,0.35)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
        "focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        /* Featured card: 4:3 landscape on mobile/tablet, fills 2×2 on lg */
        featured
          ? "aspect-[4/3] sm:aspect-[4/3] lg:aspect-auto lg:h-full"
          : "aspect-[4/3]",
      )}
      aria-label={`Shop ${cat.name}`}
    >
      {/* Gradient background */}
      <div
        className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        style={{ background: gradient }}
        aria-hidden="true"
      />

      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.04] mix-blend-overlay pointer-events-none"
        style={NOISE_STYLE}
        aria-hidden="true"
      />

      {/* Dark gradient scrim — stronger at bottom so text always readable */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent"
        aria-hidden="true"
      />

      {/* Gold overlay on hover — very subtle warm tint */}
      <div
        className="absolute inset-0 bg-gold/0 group-hover:bg-gold/[0.04] transition-colors duration-500"
        aria-hidden="true"
      />

      {/* Faint watermark letter (top-right, same as spotlight) */}
      <span
        aria-hidden="true"
        className="absolute -top-3 -right-1 font-display leading-none select-none text-white/[0.04] pointer-events-none"
        style={{ fontSize: "clamp(4rem, 12vw, 8rem)" }}
      >
        {cat.name.charAt(0).toUpperCase()}
      </span>

      {/* Gold rule slides in from left on hover */}
      <div
        className="absolute bottom-0 left-0 h-[2px] w-0 bg-gold transition-[width] duration-500 ease-out group-hover:w-full"
        aria-hidden="true"
      />

      {/* ── Card body (sits at bottom) ─────────────────────────── */}
      <div className="relative mt-auto flex items-end justify-between gap-3 p-4 sm:p-5">
        <div className="flex flex-col gap-0.5 min-w-0">
          <h3
            className={cn(
              "font-display leading-none tracking-[0.04em] text-white transition-colors duration-200 group-hover:text-gold",
              featured
                ? "text-[clamp(1.5rem,3.5vw,2.5rem)]"
                : "text-[clamp(1rem,2vw,1.5rem)]",
            )}
          >
            {cat.name.toUpperCase()}
          </h3>
          {tagline && (
            <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/50 truncate">
              {tagline}
            </p>
          )}
        </div>

        {/* Arrow circle — gold-fills on hover (Shopify theme treatment) */}
        <div
          className={cn(
            "flex-shrink-0 flex items-center justify-center rounded-full",
            "border border-white/20 text-white/50",
            "transition-[background,border-color,color,transform] duration-250",
            "group-hover:bg-gold group-hover:border-gold group-hover:text-bg group-hover:translate-x-[3px]",
            featured ? "size-10" : "size-8",
          )}
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={featured ? "size-4" : "size-3.5"}
          >
            <path d="M5 12h14" />
            <path d="M12 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
