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

// In development we allow loose patterns so LocalWP / wp.com hosted images work.
// In production we only trust explicit hostnames — wildcards on `*.local`,
// `*.test`, `*.wp.com`, `*.wordpress.com` would let an attacker craft URLs
// that bypass the image proxy origin allow-list (SSRF-ish surface).
const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  // Allow the local network IP so phones/tablets on the same WiFi can
  // access HMR and dev resources without cross-origin errors.
  allowedDevOrigins: ["192.168.0.108"],

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
      // Current Cloudways WooCommerce instance (post-recovery URL).
      { protocol: "https" as const, hostname: "woocommerce-1617708-6377079.cloudwaysapps.com" },
      // Shopify CDN — product images seeded from Shopify CSV reference these URLs.
      { protocol: "https" as const, hostname: "cdn.shopify.com" },
      // Dev-only patterns: LocalWP + wp.com staging. Excluded from prod to
      // remove SSRF/abuse surface on /api/image-proxy.
      ...(isProd
        ? []
        : [
            { protocol: "http" as const, hostname: "localhost" },
            { protocol: "http" as const, hostname: "*.local" },
            { protocol: "http" as const, hostname: "*.test" },
            { protocol: "https" as const, hostname: "*.wp.com" },
            { protocol: "https" as const, hostname: "*.wordpress.com" },
            { protocol: "https" as const, hostname: "lightslategrey-ibex-799942.hostingersite.com" },
            { protocol: "https" as const, hostname: "woocommerce-1616698-6370177.cloudwaysapps.com" },
          ]),
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
        "woocommerce-1617708-6377079.cloudwaysapps.com",
        "cdn.shopify.com",
        // Dev-only image origins (excluded in prod to harden CSP).
        ...(isProd
          ? []
          : [
              "woocommerce-1616698-6370177.cloudwaysapps.com",
              "lightslategrey-ibex-799942.hostingersite.com",
              "*.wp.com *.wordpress.com",
            ]),
      ]
        .filter(Boolean)
        .join(" "),
      // XHR / fetch targets. The browser only ever talks to our own /api/*
      // routes for Woo data — never directly to WP — so we do NOT add
      // wooHostname here. Adding it would expose the backend origin to
      // anyone who reads the CSP header.
      [
        "connect-src 'self'",
        "api.stripe.com",
        "*.klaviyo.com",
        "www.google-analytics.com",
        "*.analytics.google.com",
        "vitals.vercel-insights.com",
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
          // Belt-and-braces against clickjacking (CSP frame-ancestors
          // already covers this in modern browsers).
          { key: "X-Frame-Options", value: "DENY" },
          // Only send the origin (no full URL) as Referer to third-parties.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Block sensitive sensor APIs site-wide. Allow `payment` on self
          // for Apple Pay / Google Pay via Stripe Payment Request Button.
          {
            key: "Permissions-Policy",
            value: [
              "camera=()",
              "microphone=()",
              "geolocation=()",
              "interest-cohort=()",
              "browsing-topics=()",
              "payment=(self \"https://js.stripe.com\")",
              "usb=()",
              "magnetometer=()",
              "accelerometer=()",
              "gyroscope=()",
            ].join(", "),
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
