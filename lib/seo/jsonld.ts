import { SITE } from "@/lib/constants";
import type { Product } from "@/lib/woo/types";

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
