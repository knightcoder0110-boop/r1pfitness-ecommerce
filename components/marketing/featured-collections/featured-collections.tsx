import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { CollectionCard } from "./collection-card";
import {
  DEFAULT_COLLECTIONS,
  type Collection,
} from "./data";

/* ─── Main component ─────────────────────────────────────────────────────── */

export interface FeaturedCollectionsProps {
  /** Override the default collection list. */
  collections?: Collection[];
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  className?: string;
}

/**
 * FeaturedCollections — full editorial "shop by collection" section.
 *
 * Anatomy (top → bottom):
 *  ┌─────────────────────────────────────────────────────────────┐
 *  │  HEADER ROW                                                 │
 *  │  Left: eyebrow + headline + subtitle + CTA                  │
 *  │  Right (desktop): 4 feature signals in a 2×2 / 1×4 grid    │
 *  ├─────────────────────────────────────────────────────────────┤
 *  │  COLLECTION CARDS                                           │
 *  │  Desktop: 5-col equal grid                                  │
 *  │  Mobile: horizontal snap-scroll (each card 72vw wide)       │
 *  ├─────────────────────────────────────────────────────────────┤
 *  │  TRUST STRIP — 4 service promises in a row                  │
 *  ├─────────────────────────────────────────────────────────────┤
 *  │  OHANA BRAND — palm icon + tagline                          │
 *  └─────────────────────────────────────────────────────────────┘
 *
 * Server component — zero client JS.
 */
export function FeaturedCollections({
  collections = DEFAULT_COLLECTIONS,
  eyebrow = "Featured Collections",
  title = "Built for Purpose.\nMade to Last.",
  subtitle =
    "Explore our most iconic collections. Every piece is crafted with premium quality and relentless discipline.",
  ctaLabel = "Shop All Collections",
  ctaHref = ROUTES.shop,
  className,
}: FeaturedCollectionsProps) {
  // Center card index (featured slot)
  const featuredIdx = Math.floor(collections.length / 2);

  return (
    <section
      aria-labelledby="fc-heading"
      className={cn("bg-bg", className)}
    >
      {/* ════════════════════════════════════════════════════════
          HEADER ROW
          ════════════════════════════════════════════════════════ */}
      <div className="border-b border-border">
        <div className="mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 py-12 md:py-16 max-w-2xl">
              {/* Eyebrow */}
              <p className="font-mono text-[10px] uppercase tracking-[0.52em] text-gold">
                {eyebrow}
              </p>

              {/* Headline — newlines become line breaks */}
              <h2
                id="fc-heading"
                className="font-display uppercase text-text text-[clamp(2.4rem,6vw,4.5rem)] leading-[0.92] tracking-[0.02em]"
              >
                {title.split("\n").map((line, i) => (
                  <span key={i} className="block">
                    {line}
                  </span>
                ))}
              </h2>

              {/* Subtitle */}
              <p className="font-serif text-sm sm:text-base text-muted leading-relaxed max-w-md">
                {subtitle}
              </p>

              {/* CTA */}
              <div className="mt-2">
                <Link
                  href={ctaHref}
                  className={cn(
                    buttonVariants({ variant: "tertiary", size: "md" }),
                    "inline-flex items-center gap-2 border border-border-strong",
                  )}
                >
                  {ctaLabel}
                  <svg
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.75}
                    aria-hidden="true"
                    className="size-3.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 8h10M9 4l4 4-4 4"
                    />
                  </svg>
                </Link>
              </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          COLLECTION CARDS
          Mobile: snap-scroll horizontal track (no wrapping)
          Desktop: 5-column equal grid
          ════════════════════════════════════════════════════════ */}
      <div
        className={cn(
          /* Mobile: full-bleed horizontal scroll track */
          "overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          "border-b border-border",
        )}
        role="region"
        aria-label="Browse collections"
      >
        <ul
          role="list"
          className={cn(
            /* Mobile: flex snap row with leading/trailing padding */
            "flex gap-3 snap-x snap-mandatory scroll-smooth",
            "pl-4 sm:pl-6 lg:pl-0",
            /* Desktop: reset to CSS grid 5 equal columns with gap */
            "md:grid md:grid-cols-5 md:gap-px",
          )}
        >
          {collections.map((col, i) => (
            <li
              key={col.id}
              className={cn(
                /* Desktop grid item — stretch to fill */
                "md:contents",
              )}
            >
              <CollectionCard
                collection={col}
                featured={i === featuredIdx}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
