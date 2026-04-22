import Link from "next/link";
import { Section, type SectionProps } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { buttonVariants } from "@/components/ui/button";
import { ProductGrid } from "@/components/product/product-grid";
import type { ProductSummary } from "@/lib/woo/types";

export interface ProductRailProps
  extends Omit<SectionProps, "children"> {
  /** Gold eyebrow label above the title */
  eyebrow?: string;
  /** Section title (shown in display font) */
  title: string;
  /** Optional muted italic subtitle below the title */
  subtitle?: string;
  /** Optional "view all" link (usually /shop or a category) */
  viewAllHref?: string;
  /** Custom view-all label — default "View all" */
  viewAllLabel?: string;
  /** The products to render in a responsive 2/3/4-col grid */
  items: ProductSummary[];
  /**
   * Also show a centered footer button (same as view-all link). Useful on
   * mobile where the header link is hidden.
   */
  showFooterCta?: boolean;
  footerCtaLabel?: string;
}

/**
 * Drop-in product rail used across the home page, PDP, and category pages.
 * Composes our three primitives (`Section`, `SectionHeader`, `ProductGrid`)
 * into a single plug-and-play block — the equivalent of a Shopify
 * "Featured collection" section.
 */
export function ProductRail({
  eyebrow,
  title,
  subtitle,
  viewAllHref,
  viewAllLabel,
  items,
  showFooterCta = false,
  footerCtaLabel = "View all products",
  spacing = "lg",
  tone,
  bordered,
  className,
  ...sectionProps
}: ProductRailProps) {
  if (items.length === 0) return null;

  const headingId = `rail-${title.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <Section
      aria-labelledby={headingId}
      spacing={spacing}
      tone={tone}
      bordered={bordered}
      className={className}
      {...sectionProps}
    >
      <SectionHeader
        id={headingId}
        eyebrow={eyebrow}
        title={title}
        subtitle={subtitle}
        viewAllHref={viewAllHref}
        viewAllLabel={viewAllLabel}
      />

      <ProductGrid items={items} />

      {showFooterCta && viewAllHref && (
        <div className="mt-12 flex justify-center">
          <Link
            href={viewAllHref}
            className={buttonVariants({ variant: "outline", size: "md" })}
          >
            {footerCtaLabel}
          </Link>
        </div>
      )}
    </Section>
  );
}
