import type { Metadata } from "next";
import { SITE } from "@/lib/constants";

/**
 * Default metadata applied to the root layout. Every page uses `generateMetadata`
 * to override title/description/OG — these defaults cover `metadataBase`,
 * templates, and social fallbacks.
 */
export function buildDefaultMetadata(siteUrl: string | undefined): Metadata {
  const base = siteUrl ? new URL(siteUrl) : undefined;
  return {
    ...(base ? { metadataBase: base } : {}),
    title: {
      default: SITE.defaultTitle,
      template: `%s — ${SITE.name}`,
    },
    description: SITE.defaultDescription,
    applicationName: SITE.name,
    openGraph: {
      type: "website",
      locale: SITE.locale,
      siteName: SITE.name,
      title: SITE.defaultTitle,
      description: SITE.defaultDescription,
      images: [SITE.defaultOgImage],
    },
    twitter: {
      card: "summary_large_image",
      title: SITE.defaultTitle,
      description: SITE.defaultDescription,
      images: [SITE.defaultOgImage],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}
