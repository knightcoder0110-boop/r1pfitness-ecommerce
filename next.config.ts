import type { NextConfig } from "next";

/**
 * Parse a URL string and return a hostname, or null if invalid.
 * Used to add the WooCommerce WordPress host to the image allow-list.
 */
function hostnameFromUrl(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

const wooHostname = process.env.WOO_BASE_URL
  ? hostnameFromUrl(process.env.WOO_BASE_URL)
  : null;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Production WordPress / WooCommerce install (read from WOO_BASE_URL at build time).
      ...(wooHostname
        ? [{ protocol: "https" as const, hostname: wooHostname }]
        : []),
      // Local WordPress development (common patterns: localhost, *.local, *.test).
      { protocol: "http" as const, hostname: "localhost" },
      { protocol: "http" as const, hostname: "*.local" },
      { protocol: "http" as const, hostname: "*.test" },
      // WP.com CDN and common managed WP hosts.
      { protocol: "https" as const, hostname: "*.wp.com" },
      { protocol: "https" as const, hostname: "*.wordpress.com" },
    ],
  },

  async redirects() {
    const permanent = true;
    return [
      // ── Shopify product & collection pages ─────────────
      { source: "/products/:slug*",    destination: "/product/:slug*", permanent },
      { source: "/collections/:slug*", destination: "/shop/:slug*", permanent },
      { source: "/collections",        destination: "/shop", permanent },

      // ── Account & auth ──────────────────────────────────
      { source: "/account/:path*",     destination: "/", permanent },
      { source: "/account",            destination: "/", permanent },
      { source: "/login",              destination: "/", permanent },
      { source: "/services/:path*",    destination: "/", permanent },

      // ── Pages, blogs, contact ───────────────────────────
      { source: "/pages/:slug*",       destination: "/", permanent },
      { source: "/pages",              destination: "/", permanent },
      { source: "/blogs/:path*",       destination: "/", permanent },
      { source: "/blogs",              destination: "/", permanent },
      { source: "/contact",            destination: "/", permanent },

      // ── Discounts ───────────────────────────────────────
      { source: "/discount/:code*",    destination: "/", permanent },

      // ── Shopify internal/tracking paths ─────────────────
      { source: "/o/:path*",           destination: "/", permanent },
      { source: "/_t/:path*",          destination: "/", permanent },
      { source: "/:shopId/checkouts/:path*", destination: "/", permanent },
    ];
  },
};

export default nextConfig;
