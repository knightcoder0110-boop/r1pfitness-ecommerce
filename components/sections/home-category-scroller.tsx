import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

/**
 * HomeCategoryScroller — hand-curated horizontal scroll of category tiles,
 * rendered directly below the hero on the homepage.
 *
 * Why a dedicated component instead of reusing `<ShopByCategorySection>`:
 *  - The homepage list is EDITORIAL (fixed order, fixed labels) and must
 *    always include slots like "Mystery Boxes" that may not yet exist as
 *    Woo product categories. The Woo-backed section drops any tile whose
 *    slug doesn't resolve; here we need every tile to render regardless.
 *  - Tiles are hand-curated with their own imagery from `/public/images/*`
 *    so we don't depend on Woo category cover photos being uploaded.
 *
 * Layout: snap-x horizontal scroll on every breakpoint (feels good on
 * mobile, still reads as a row on desktop within the 1440 container).
 * Each tile is a 2:3 portrait card.
 */

export interface HomeCategoryTile {
  label: string;
  href: string;
  image: string;
  tagline?: string;
  /** Optional hint text — e.g. "Coming soon". */
  note?: string;
}

export interface HomeCategoryScrollerProps {
  eyebrow?: string;
  title: string;
  description?: string;
  tiles: HomeCategoryTile[];
  className?: string;
}

const NOISE_BG =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export function HomeCategoryScroller({
  eyebrow,
  title,
  description,
  tiles,
  className,
}: HomeCategoryScrollerProps) {
  if (tiles.length === 0) return null;

  return (
    <section
      aria-label={title}
      className={cn("py-12 sm:py-16 lg:py-20 border-b border-border overflow-hidden", className)}
    >
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-6 sm:mb-8 flex flex-col gap-3">
          {eyebrow && (
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-gold" aria-hidden />
              <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-gold">
                {eyebrow}
              </p>
            </div>
          )}
          <h2 className="font-display uppercase tracking-[0.04em] text-text text-[clamp(1.75rem,4vw,3rem)] leading-[0.95]">
            {title}
          </h2>
          {description && (
            <p className="text-muted text-sm sm:text-base max-w-2xl leading-relaxed">
              {description}
            </p>
          )}
        </header>

        {/* Scroller */}
        <div
          className={cn(
            "flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory",
            "pb-2",
            "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          )}
          role="list"
        >
          {tiles.map((tile, i) => (
            <div
              key={tile.label}
              role="listitem"
              className="snap-start shrink-0 w-[62%] sm:w-[38%] md:w-[28%] lg:w-[22%]"
            >
              <Link
                href={tile.href}
                className="group relative block overflow-hidden rounded-sm bg-surface-2"
                style={{ aspectRatio: "2 / 3" }}
              >
                {/* Image */}
                <Image
                  src={tile.image}
                  alt={tile.label}
                  fill
                  sizes="(max-width: 640px) 62vw, (max-width: 768px) 38vw, (max-width: 1024px) 28vw, 22vw"
                  className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                  priority={i < 2}
                />

                {/* Film-grain overlay */}
                <div
                  aria-hidden
                  className="absolute inset-0 opacity-[0.05] mix-blend-overlay pointer-events-none"
                  style={{ backgroundImage: NOISE_BG, backgroundSize: "200px 200px" }}
                />

                {/* Bottom scrim */}
                <div
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-bg/95 via-bg/55 to-transparent"
                />

                {/* Tagline pill */}
                {tile.tagline && (
                  <span
                    className="absolute top-3 left-3 inline-block font-mono text-[9px] uppercase tracking-[0.3em] text-gold bg-black/65 backdrop-blur-sm border border-gold/50 px-2 py-1"
                  >
                    {tile.tagline}
                  </span>
                )}

                {/* Footer — label + note + arrow */}
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 flex flex-col gap-1.5">
                  <span className="font-display tracking-[0.08em] text-text text-xl sm:text-2xl leading-none group-hover:text-gold transition-colors duration-200">
                    {tile.label.toUpperCase()}
                  </span>
                  {tile.note && (
                    <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-subtle">
                      {tile.note}
                    </span>
                  )}
                  <span className="mt-2 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.35em] text-gold/90 group-hover:gap-3 transition-all duration-200">
                    Shop <span aria-hidden>→</span>
                  </span>
                </div>

                {/* Gold rule on hover */}
                <div
                  aria-hidden
                  className="absolute bottom-0 left-0 h-0.5 w-0 bg-gold transition-[width] duration-500 ease-out group-hover:w-full"
                />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
