import Image from "next/image";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { resolveCategoryGradient, getCategoryMeta } from "@/lib/catalog/category-meta";
import type { ProductCategory } from "@/lib/woo/types";
import { cn } from "@/lib/utils/cn";

/**
 * Unified CategoryCard — the single source of truth for "shop by category"
 * tiles across the storefront.
 *
 * Supersedes four prior implementations:
 *  - components/marketing/featured-collections/collection-card.tsx
 *  - components/marketing/category-grid.tsx (inline CategoryCard)
 *  - components/marketing/category-scroller.tsx (inline card)
 *  - app/(commerce)/collections/page.tsx (inline card)
 *
 * Anatomy (portrait variant):
 *   ┌─────────────────────────────────────────────┐
 *   │  [tagline pill — top-left]                  │
 *   │                                             │
 *   │  Cover image OR gradient bg                 │
 *   │  (scale 1.06 on hover)                      │
 *   │                                             │
 *   │  · Film-grain noise overlay                 │
 *   │  · Centred watermark letter (very faint)    │
 *   │  · Bottom scrim                             │
 *   ├─────────────────────────────────────────────┤
 *   │  NAME (display, gold on hover)              │
 *   │  Shop collection    ·   arrow circle        │
 *   └─────────────────────────────────────────────┘
 *
 * Server component — no client JS. Image fallback chain:
 *   1. Real `category.image.url` from Woo
 *   2. Gradient from `CATEGORY_META[slug]`
 *   3. Cycled `FALLBACK_GRADIENTS[index % 6]`
 */

const NOISE_BG =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export interface CategoryCardProps {
  category: ProductCategory;
  /** Index in the list — used to pick a deterministic fallback gradient. */
  index?: number;
  /**
   * When true, renders a larger featured tile (fills bento 2×2 slot; body
   * bar is taller). Usually only one card in a section is featured.
   */
  featured?: boolean;
  /**
   * `grid` — square-ish standard card (default).
   * `portrait` — 2:3 tall editorial ratio.
   * `scroller` — fixed mobile width + 2:3 portrait, snaps in a flex row.
   */
  variant?: "grid" | "portrait" | "scroller";
  /** Hint Next's image loader to eagerly load (above-the-fold). */
  priority?: boolean;
  /**
   * Override the card's tagline. Defaults to the curated meta tagline (if
   * the slug is registered in `CATEGORY_META`), else nothing.
   */
  tagline?: string;
  /** When false, the item-count badge is hidden (useful on dense bento layouts). */
  showCount?: boolean;
  className?: string;
}

/**
 * Renders one category tile. Visual parity with the old `CategoryGrid` card
 * (bento-style, watermark letter, tagline pill, arrow-circle CTA).
 */
export function CategoryCard({
  category,
  index = 0,
  featured = false,
  variant = "portrait",
  priority = false,
  tagline,
  showCount = true,
  className,
}: CategoryCardProps) {
  const meta = getCategoryMeta(category.slug);
  const gradient = resolveCategoryGradient(category.slug, index);
  const effectiveTagline = tagline ?? meta?.tagline;
  const cover = category.image;
  const count = category.count;

  return (
    <Link
      href={ROUTES.category(category.slug)}
      aria-label={`Shop ${category.name}${count ? ` — ${count} items` : ""}`}
      className={cn(
        // Base card frame
        "group flex flex-col overflow-hidden rounded-sm",
        "border border-white/[0.08]",
        "transition-[border-color,transform,box-shadow] duration-[400ms]",
        "[transition-timing-function:cubic-bezier(0.16,1,0.3,1)]",
        "will-change-transform",
        "hover:border-gold hover:-translate-y-1",
        "hover:shadow-[0_24px_56px_rgba(0,0,0,0.60),0_0_0_1px_rgba(201,168,76,1)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
        "focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        // Layout per variant
        variant === "scroller" &&
          "shrink-0 snap-start w-[72vw] max-w-[260px] sm:w-52 md:w-60 lg:w-64",
        featured && "lg:h-full",
        className,
      )}
    >
      {/* ── Media area ──────────────────────────────────────────────── */}
      <div
        className={cn(
          "relative overflow-hidden",
          variant === "grid" && "aspect-collection-cover",
          (variant === "portrait" || variant === "scroller") && "aspect-editorial",
          // Featured on desktop: override ratio, fill remaining flex height
          featured && "lg:[aspect-ratio:auto] lg:flex-1 lg:min-h-[300px]",
        )}
      >
        {/* Gradient base (always rendered — sits under the image for fallback) */}
        <div
          aria-hidden
          className="absolute inset-0 transition-transform duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
          style={{ background: gradient }}
        />

        {/* Cover image from Woo, when present */}
        {cover?.url && (
          <div
            aria-hidden
            className="absolute inset-0 transition-transform duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
          >
            <Image
              src={cover.url}
              alt=""
              fill
              priority={priority}
              sizes={
                variant === "scroller"
                  ? "(max-width: 768px) 72vw, 260px"
                  : featured
                    ? "(max-width: 1024px) 100vw, 50vw"
                    : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              }
              className="object-cover object-center"
            />
          </div>
        )}

        {/* Film-grain noise */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.055] mix-blend-overlay"
          style={{ backgroundImage: NOISE_BG, backgroundSize: "200px 200px" }}
        />

        {/* Bottom scrim for readability when body-bar sits on top of image */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[30%] bg-gradient-to-t from-black/50 to-transparent"
        />

        {/* Watermark letter — only when no cover image (keeps image clean) */}
        {!cover?.url && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-center justify-center font-display leading-none select-none text-white/[0.04]"
            style={{
              fontSize: featured
                ? "clamp(10rem,30vw,22rem)"
                : "clamp(6rem,18vw,14rem)",
            }}
          >
            {category.name.charAt(0).toUpperCase()}
          </span>
        )}

        {/* Tagline pill — top-left */}
        {effectiveTagline && (
          <div
            aria-hidden
            className="absolute top-3.5 left-3.5 px-2.5 py-[5px] rounded-full bg-bg/[0.72] backdrop-blur-sm border border-white/[0.10]"
          >
            <span className="font-mono text-[8.5px] uppercase tracking-[0.2em] text-muted leading-none whitespace-nowrap">
              {effectiveTagline}
            </span>
          </div>
        )}

        {/* Item-count badge — top-right, only when count available */}
        {showCount && typeof count === "number" && count > 0 && (
          <div
            aria-hidden
            className="absolute top-3.5 right-3.5 px-2.5 py-[5px] rounded-full bg-bg/[0.72] backdrop-blur-sm border border-white/[0.10]"
          >
            <span className="font-mono text-[8.5px] uppercase tracking-[0.22em] text-gold leading-none whitespace-nowrap">
              {count} {count === 1 ? "item" : "items"}
            </span>
          </div>
        )}
      </div>

      {/* ── Body bar ─────────────────────────────────────────────────── */}
      <div
        className={cn(
          "flex items-center justify-between gap-3",
          "px-4 sm:px-5",
          featured ? "py-4 sm:py-[18px]" : "py-3.5 sm:py-4",
          "bg-surface-1 border-t border-white/[0.06]",
        )}
      >
        <div className="flex flex-col gap-[5px] min-w-0">
          <h3
            className={cn(
              "font-display leading-none tracking-[0.04em] text-text",
              "transition-colors duration-[250ms] group-hover:text-gold",
              featured
                ? "text-[clamp(1.1rem,1.75vw,1.65rem)]"
                : "text-[clamp(0.9rem,1.35vw,1.2rem)]",
            )}
          >
            {category.name.toUpperCase()}
          </h3>
          <p className="font-mono text-[8.5px] uppercase tracking-[0.3em] text-subtle leading-none">
            Shop collection
          </p>
        </div>

        {/* Arrow circle */}
        <div
          aria-hidden
          className={cn(
            "flex-shrink-0 flex items-center justify-center rounded-full",
            "border border-border text-subtle",
            "transition-[background-color,border-color,color,transform] duration-[250ms]",
            "group-hover:bg-gold group-hover:border-gold group-hover:text-bg group-hover:translate-x-[3px]",
            featured ? "size-9 sm:size-10" : "size-8 sm:size-9",
          )}
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            className="size-3.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 8h10M9 4l4 4-4 4"
            />
          </svg>
        </div>
      </div>
    </Link>
  );
}
