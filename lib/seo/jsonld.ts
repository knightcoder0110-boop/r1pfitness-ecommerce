import { SITE } from "@/lib/constants";

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
