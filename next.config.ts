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
    // Cache images for 30 days on the Next.js image proxy.
    // Without this every unique URL re-fetches from Hostinger on expiry.
    minimumCacheTTL: 2592000,
    // Next.js 15+ restricts local <Image> src paths when localPatterns is
    // defined. Omitting `search` from a pattern means "match any query
    // string" (including none). `/**` covers all public/ assets, and the
    // explicit proxy entry ensures /api/image-proxy?url=... is accepted.
    localPatterns: [
      { pathname: "/api/image-proxy" },
      { pathname: "/**" },
    ],
    remotePatterns: [
      // Active WooCommerce install (read from WOO_BASE_URL at build time).
      ...(wooHostname
        ? [{ protocol: "https" as const, hostname: wooHostname }]
        : []),
      // Cloudways WooCommerce instance (fallback in case WOO_BASE_URL isn't set at build time).
      { protocol: "https" as const, hostname: "woocommerce-1616698-6370177.cloudwaysapps.com" },
      // Previous Hostinger WooCommerce instance (products seeded from here may still reference it).
      { protocol: "https" as const, hostname: "lightslategrey-ibex-799942.hostingersite.com" },
      // Local WordPress development (common patterns: localhost, *.local, *.test).
      { protocol: "http" as const, hostname: "localhost" },
      { protocol: "http" as const, hostname: "*.local" },
      { protocol: "http" as const, hostname: "*.test" },
      // WP.com CDN and common managed WP hosts.
      { protocol: "https" as const, hostname: "*.wp.com" },
      { protocol: "https" as const, hostname: "*.wordpress.com" },
      // Shopify CDN — product images seeded from Shopify CSV reference these URLs.
      { protocol: "https" as const, hostname: "cdn.shopify.com" },
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
        "woocommerce-1616698-6370177.cloudwaysapps.com",
        "lightslategrey-ibex-799942.hostingersite.com",
        "cdn.shopify.com",
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
          // HSTS — tell browsers to always use HTTPS for 2 years.
          // Only sent in production; localhost with HTTPS would break dev.
          ...(!isDev
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=63072000; includeSubDomains; preload",
                },
              ]
            : []),
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

      // ── Legacy Shopify paths we don't use ──────────────
      // NOTE: /account/*, /login, /pages/*, /blogs/*, /contact are REAL routes
      // in this app. They must NOT be redirected away. Shopify `/blogs/*` is
      // rewritten to our `/blog/*` so old URLs still work.
      { source: "/services/:path*",    destination: "/", permanent },
      { source: "/blogs/:path*",       destination: "/blog/:path*", permanent },
      { source: "/blogs",              destination: "/blog", permanent },

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
