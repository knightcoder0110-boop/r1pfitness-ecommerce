import Link from "next/link";
import { Section, type SectionProps } from "@/components/ui/section";
import { buttonVariants } from "@/components/ui/button";
import { ProductGrid } from "@/components/product/product-grid";
import { cn } from "@/lib/utils/cn";
import type { ProductSummary } from "@/lib/woo/types";

export interface ProductRailProps
  extends Omit<SectionProps, "children"> {
  /** Gold monospace eyebrow above the title — e.g. "New Arrivals" */
  eyebrow?: string;
  /** Section title rendered in display font — e.g. "Latest Drops" */
  title: string;
  /** Optional italic subtitle shown below the title */
  subtitle?: string;
  /** When provided, adds a "View all →" link in the header + a mobile footer CTA */
  viewAllHref?: string;
  /** Custom label for the "View all" link. Defaults to "View all" */
  viewAllLabel?: string;
  /** Products to display. Always capped at 4 columns desktop, 2 mobile. */
  items: ProductSummary[];
  /** Label for the mobile footer CTA. Defaults to viewAllLabel */
  footerCtaLabel?: string;
}

/**
 * Premium product rail — the R1P equivalent of a Shopify "Featured collection" section.
 *
 * Layout:
 *  Desktop │ [gold rule] EYEBROW    ·    title (big)    ·    View all →
 *          │ ─────────────────────────(gold left accent)──────────────────
 *          │ [card] [card] [card] [card]                     4-col, xl container
 *
 *  Mobile  │ [gold rule] eyebrow
 *          │ TITLE
 *          │ ─────────
 *          │ [card] [card]                                   2-col
 *          │ [View all products →]                           footer CTA
 *
 * Always uses Container size="xl" (1536px) to reduce dead space on wide screens.
 */
export function ProductRail({
  eyebrow,
  title,
  subtitle,
  viewAllHref,
  viewAllLabel = "View all",
  items,
  footerCtaLabel,
  spacing = "lg",
  tone,
  bordered,
  className,
  ...sectionProps
}: ProductRailProps) {
  if (items.length === 0) return null;

  const headingId = `rail-${title.toLowerCase().replace(/\s+/g, "-")}`;
  const mobileCta = footerCtaLabel ?? viewAllLabel;

  return (
    <Section
      aria-labelledby={headingId}
      spacing={spacing}
      tone={tone}
      bordered={bordered}
      containerSize="xl"
      className={className}
      {...sectionProps}
    >
      {/* ── Rail header ──────────────────────────────────────────────── */}
      <header className="mb-8 sm:mb-10">
        {/* Eyebrow */}
        {eyebrow && (
          <div className="flex items-center gap-3 mb-3">
            <span className="h-px w-8 flex-shrink-0 bg-gold" aria-hidden="true" />
            <p className="font-mono text-[10px] uppercase tracking-[0.45em] text-gold">
              {eyebrow}
            </p>
          </div>
        )}

        {/* Title row + inline View all on desktop */}
        <div className="relative flex items-end justify-between gap-6 pb-5">
          <div>
            <h2
              id={headingId}
              className="font-display text-[clamp(2.25rem,5vw,4rem)] leading-none tracking-wide text-text"
            >
              {title.toUpperCase()}
            </h2>
            {subtitle && (
              <p className="mt-2 font-serif italic text-base text-subtle">
                {subtitle}
              </p>
            )}
          </div>

          {/* Desktop view-all — right-aligned, aligned to title baseline */}
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className={cn(
                "hidden sm:inline-flex items-center gap-2 shrink-0 self-end",
                "font-mono text-[10px] uppercase tracking-[0.35em]",
                "text-muted hover:text-gold transition-colors duration-200",
                "mb-[3px]", // nudge to sit just above the divider
              )}
            >
              {viewAllLabel}
              <span aria-hidden="true" className="text-sm leading-none">→</span>
            </Link>
          )}

          {/* Divider with gold left accent */}
          <span
            aria-hidden="true"
            className="absolute bottom-0 left-0 right-0 h-px bg-border"
          />
          <span
            aria-hidden="true"
            className="absolute bottom-0 left-0 h-px w-20 bg-gold"
          />
        </div>
      </header>

      {/* ── 4-column grid ────────────────────────────────────────────── */}
      <ProductGrid items={items} columns={4} />

      {/* ── Mobile footer CTA (hidden on sm+) ───────────────────────── */}
      {viewAllHref && (
        <div className="mt-10 flex justify-center sm:hidden">
          <Link
            href={viewAllHref}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            {mobileCta}
          </Link>
        </div>
      )}
    </Section>
  );
}
