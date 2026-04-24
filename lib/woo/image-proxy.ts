/**
 * WooCommerce image URL → local proxy URL rewriter.
 *
 * When images are mapped from Woo API responses, URLs pointing at the
 * WooCommerce host are rewritten to `/api/image-proxy?url=…`.  The proxy
 * route then fetches from the upstream and forwards the result, bypassing
 * Next.js's private-IP SSRF guard (which incorrectly flags the Cloudways
 * NAT64 address as private).
 *
 * The returned URL is relative (`/api/image-proxy?…`), so Next.js image
 * optimisation still applies — the optimiser fetches from the same server
 * and never sees the Cloudways hostname directly.
 */

/** Hostnames whose images should be proxied through `/api/image-proxy`. */
function buildProxyHostnames(): Set<string> {
  const set = new Set<string>();

  const wooBase = process.env.WOO_BASE_URL;
  if (wooBase) {
    try {
      set.add(new URL(wooBase).hostname);
    } catch {
      // malformed — ignore
    }
  }

  // Hardcoded fallbacks so local dev and CI work without env vars.
  set.add("woocommerce-1616698-6370177.cloudwaysapps.com");
  set.add("lightslategrey-ibex-799942.hostingersite.com");

  return set;
}

// Module-level singleton — built once per process.
const PROXY_HOSTNAMES: Set<string> = buildProxyHostnames();

/**
 * Returns `/api/image-proxy?url=<encoded>` for WooCommerce-hosted URLs,
 * or the original URL unchanged for everything else (local `/` paths, CDNs
 * we don't need to proxy, fixture placeholder images, etc.).
 */
export function proxyWooImageUrl(originalUrl: string): string {
  if (!originalUrl) return originalUrl;

  // Don't rewrite relative URLs (fixture placeholders like `/icon.png`).
  if (!originalUrl.startsWith("http://") && !originalUrl.startsWith("https://")) {
    return originalUrl;
  }

  try {
    const { hostname } = new URL(originalUrl);
    if (PROXY_HOSTNAMES.has(hostname)) {
      return `/api/image-proxy?url=${encodeURIComponent(originalUrl)}`;
    }
  } catch {
    // Invalid URL — return unchanged.
  }

  return originalUrl;
}
