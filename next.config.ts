import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    const permanent = true;
    return [
      // ── Shopify product & collection pages ─────────────
      { source: "/products/:slug*",    destination: "/", permanent },
      { source: "/collections/:slug*", destination: "/", permanent },
      { source: "/collections",        destination: "/", permanent },

      // ── Cart & checkout ─────────────────────────────────
      { source: "/cart/:path*",        destination: "/", permanent },
      { source: "/cart",               destination: "/", permanent },
      { source: "/checkout/:path*",    destination: "/", permanent },
      { source: "/checkout",           destination: "/", permanent },

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
