import { SITE } from "@/lib/constants";
import type { Product, ProductCategory, ProductSummary } from "@/lib/woo/types";

/**
 * JSON-LD helpers. Return a plain object — call site embeds via:
 *   <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema()) }} />
 *
 * Phase 0 ships Organization + WebSite. Product / Article / FAQ schemas
 * arrive alongside their respective routes in later phases.
 */

export function organizationSchema(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}#organization`,
    name: SITE.legalName,
    url: siteUrl,
    logo: `${siteUrl}/icon.png`,
    sameAs: [SITE.social.instagram],
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE.address.street,
      addressLocality: SITE.address.city,
      addressRegion: SITE.address.region,
      postalCode: SITE.address.postalCode,
      addressCountry: SITE.address.country,
    },
  };
}

export function websiteSchema(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}#website`,
    url: siteUrl,
    name: SITE.name,
    description: SITE.defaultDescription,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Schema.org Product + Offer. Call inside the PDP with the current product and
 * the absolute product URL.
 */
/**
 * Schema.org BreadcrumbList — one entry per crumb, 1-indexed position.
 * Pass absolute URLs (helper builds them via getSiteUrl at the call site).
 */
export interface BreadcrumbSchemaItem {
  name: string;
  /** Absolute URL. Omit on the last (current) crumb — schema allows this. */
  url?: string;
}

export function breadcrumbSchema(items: BreadcrumbSchemaItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      ...(item.url ? { item: item.url } : {}),
    })),
  };
}

export function productSchema(product: Product, productUrl: string) {
  const availability =
    product.stockStatus === "out_of_stock"
      ? "https://schema.org/OutOfStock"
      : "https://schema.org/InStock";

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription || product.name,
    sku: product.id,
    image: product.images.map((i) => i.url),
    brand: { "@type": "Brand", name: SITE.legalName },
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: product.price.currency,
      price: (product.price.amount / 100).toFixed(2),
      availability,
      itemCondition: "https://schema.org/NewCondition",
    },
  };
}

/**
 * Schema.org CollectionPage + embedded ItemList for a category page.
 *
 * Google uses the ItemList to surface category pages as collection rich
 * results. We keep offers inline (price + availability) so the listing can
 * qualify for `product` snippets without a second crawl.
 */
export function collectionPageSchema(
  category: ProductCategory,
  items: ProductSummary[],
  categoryUrl: string,
  siteUrl: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${categoryUrl}#collection`,
    url: categoryUrl,
    name: category.name,
    description:
      category.description ||
      `${category.name} from ${SITE.legalName} — limited runs, heavyweight fabric, made in ${SITE.address.city}, ${SITE.address.region}.`,
    ...(category.image?.url ? { image: category.image.url } : {}),
    isPartOf: { "@id": `${siteUrl}#website` },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: items.length,
      itemListElement: items.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Product",
          name: p.name,
          url: `${siteUrl}/product/${p.slug}`,
          ...(p.image?.url ? { image: p.image.url } : {}),
          sku: p.id,
          offers: {
            "@type": "Offer",
            priceCurrency: p.price.currency,
            price: (p.price.amount / 100).toFixed(2),
            availability:
              p.stockStatus === "out_of_stock"
                ? "https://schema.org/OutOfStock"
                : "https://schema.org/InStock",
          },
        },
      })),
    },
  };
}
