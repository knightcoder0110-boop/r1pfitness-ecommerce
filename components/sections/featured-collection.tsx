import { getCatalog } from "@/lib/catalog";
import { ProductRail } from "@/components/product/product-rail";
import { ROUTES } from "@/lib/constants";
import type { ProductSummary } from "@/lib/woo/types";
import type { SectionProps } from "@/components/ui/section";

/**
 * Server component — "Featured collection" section.
 *
 * Wraps the existing `<ProductRail>` with a typed data-source discriminator so
 * callers declare *what* to show, not *how* to fetch it. Sprint A's catalog
 * filters (`categories[]`, `slugs[]`, `tag`, `featured`, `onSale`) do the
 * heavy lifting.
 *
 * Sources:
 *   { kind: "category",   slug }       single category
 *   { kind: "categories", slugs }      multi-category OR
 *   { kind: "tag",        slug }       single tag
 *   { kind: "featured" }               flagged-featured products
 *   { kind: "onSale" }                 compareAtPrice > price
 *   { kind: "manual",     slugs }      hand-picked in author-supplied order
 *
 * Behavior:
 *   - Returns `null` if 0 products resolve. No empty headers on the page.
 *   - If `viewAllHref` is omitted for a category source, auto-links to
 *     `ROUTES.category(slug)` as a sensible default.
 *   - `productCount` is capped at 4 (the rail's design limit).
 */

export type FeaturedCollectionSource =
  | { kind: "category"; slug: string }
  | { kind: "categories"; slugs: string[] }
  | { kind: "tag"; slug: string }
  | { kind: "featured" }
  | { kind: "onSale" }
  | { kind: "manual"; slugs: string[] };

export interface FeaturedCollectionSectionProps
  extends Pick<SectionProps, "spacing" | "tone" | "bordered" | "className"> {
  /** What to fetch. See `FeaturedCollectionSource`. */
  source: FeaturedCollectionSource;
  /** Section title (rail headline). Required for a11y. */
  title: string;
  /** Gold mono eyebrow above the title. */
  eyebrow?: string;
  /** Italic sub-line below the title. */
  subtitle?: string;
  /** Override for the "View all" link. Falls back to category route if omitted. */
  viewAllHref?: string;
  viewAllLabel?: string;
  footerCtaLabel?: string;
  /** Number of products to fetch/render. Default 4, max 4. */
  productCount?: number;
  /** Sort order applied to the underlying list query. Default: `featured`. */
  sort?: "featured" | "newest" | "price-asc" | "price-desc";
}

/**
 * Resolve a source discriminator into a live list of products.
 *
 * Extracted to its own function so the fetch logic stays testable in
 * isolation from rendering.
 */
async function fetchBySource(
  source: FeaturedCollectionSource,
  count: number,
  sort: FeaturedCollectionSectionProps["sort"],
): Promise<ProductSummary[]> {
  const catalog = getCatalog();

  switch (source.kind) {
    case "category": {
      const res = await catalog.listProducts({
        category: source.slug,
        pageSize: count,
        sort,
      });
      return res.items;
    }
    case "categories": {
      const res = await catalog.listProducts({
        categories: source.slugs,
        pageSize: count,
        sort,
      });
      return res.items;
    }
    case "tag": {
      const res = await catalog.listProducts({
        tag: source.slug,
        pageSize: count,
        sort,
      });
      return res.items;
    }
    case "featured": {
      const res = await catalog.listProducts({
        featured: true,
        pageSize: count,
        sort,
      });
      return res.items;
    }
    case "onSale": {
      const res = await catalog.listProducts({
        onSale: true,
        pageSize: count,
        sort,
      });
      return res.items;
    }
    case "manual": {
      if (source.slugs.length === 0) return [];
      const res = await catalog.listProducts({
        slugs: source.slugs.slice(0, count),
        pageSize: count,
      });
      return res.items;
    }
  }
}

/**
 * Derive a sensible default "View all" URL for the source when the caller
 * doesn't specify one.
 */
function defaultViewAllHref(source: FeaturedCollectionSource): string | undefined {
  switch (source.kind) {
    case "category":
      return ROUTES.category(source.slug);
    case "categories":
      // Ambiguous — no single destination. Let caller specify.
      return undefined;
    case "tag":
      // No tag archive route today. Let caller specify.
      return undefined;
    case "featured":
    case "onSale":
    case "manual":
      return undefined;
  }
}

export async function FeaturedCollectionSection({
  source,
  title,
  eyebrow,
  subtitle,
  viewAllHref,
  viewAllLabel,
  footerCtaLabel,
  productCount = 4,
  sort = "featured",
  spacing,
  tone,
  bordered,
  className,
}: FeaturedCollectionSectionProps) {
  const count = Math.max(1, Math.min(productCount, 4));
  const items = await fetchBySource(source, count, sort);

  if (items.length === 0) return null;

  return (
    <ProductRail
      title={title}
      eyebrow={eyebrow}
      subtitle={subtitle}
      viewAllHref={viewAllHref ?? defaultViewAllHref(source)}
      viewAllLabel={viewAllLabel}
      footerCtaLabel={footerCtaLabel}
      items={items}
      spacing={spacing}
      tone={tone}
      bordered={bordered}
      className={className}
    />
  );
}
