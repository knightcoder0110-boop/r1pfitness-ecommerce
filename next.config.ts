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

  async headers() {
    const isDev = process.env.NODE_ENV === "development";

    // Build the Content-Security-Policy directive list.
    const cspDirectives: string[] = [
      "default-src 'self'",
      // Next.js inline scripts + Stripe payment element + Klaviyo embed
      [
        "script-src 'self'",
        isDev ? "'unsafe-eval'" : "",          // webpack HMR in dev
        "'unsafe-inline'",                      // Next.js inline init scripts
        "js.stripe.com",
        "static.klaviyo.com",
        "www.googletagmanager.com",
      ]
        .filter(Boolean)
        .join(" "),
      // Tailwind injects inline styles; Google Fonts stylesheet
      "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
      // Google Fonts CDN
      "font-src 'self' fonts.gstatic.com",
      // Self + data URIs (Next.js blur placeholders) + WP CDN
      [
        "img-src 'self' data: blob:",
        wooHostname ? wooHostname : "",
        "*.wp.com *.wordpress.com",
      ]
        .filter(Boolean)
        .join(" "),
      // XHR / fetch targets
      [
        "connect-src 'self'",
        "api.stripe.com",
        "*.klaviyo.com",
        // Allow the woo origin for direct API calls made from the browser (if any)
        process.env.NEXT_PUBLIC_WOO_BASE_URL ?? "",
      ]
        .filter(Boolean)
        .join(" "),
      // Stripe payment element renders in an iframe
      "frame-src js.stripe.com",
      // Prevent this site from being embedded in foreign iframes (clickjacking)
      "frame-ancestors 'none'",
      // Lock down <base> hijacking
      "base-uri 'self'",
      // Klaviyo newsletter forms submit to their hosted action URL
      "form-action 'self' manage.kmail-lists.com",
    ];

    const csp = cspDirectives.join("; ");

    return [
      {
        // Apply to all routes.
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          // Prevent browsers from MIME-sniffing scripts.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Only send the origin (no full URL) as Referer to third-parties.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Allow camera/mic only on checkout where Stripe might need them.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
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
