import type { MetadataRoute } from "next";
import { ROUTES } from "@/lib/constants";
import { absoluteUrl } from "@/lib/utils/format";
import { getSiteUrl } from "@/lib/seo/site-url";

function toUrl(path: string): string {
  return absoluteUrl(path, getSiteUrl());
}

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Each disallow already covers all sub-paths — no trailing slash variants needed.
        disallow: [
          ROUTES.cart,
          ROUTES.checkout,
          ROUTES.account,
          ROUTES.search,
          "/api/",
          "/drop/",
          "/locked",
        ],
      },
    ],
    sitemap: toUrl("/sitemap.xml"),
  };
}