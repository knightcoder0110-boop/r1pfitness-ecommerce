import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { isValidSiteUnlockCookieValue, SITE_UNLOCK_COOKIE } from "@/lib/site-lock-cookie";

/**
 * Paths that always bypass the site-wide lock.
 * The matcher regex below already strips /_next/*, static files, and images,
 * so only page/API routes reach this handler.
 */
const LOCK_BYPASS_PREFIXES = [
  "/locked",
  "/api/site-unlock",
  "/api/auth",
  "/api/webhooks",
  // Image proxy must bypass the lock — otherwise Next.js's image optimizer
  // follows the redirect to /locked, receives HTML, and logs
  // "The requested resource isn't a valid image ... received null".
  "/api/image-proxy",
  // Newsletter / VIP-list signup. The site-lock screen itself collects
  // emails via this endpoint, so it MUST work without the unlock cookie
  // — otherwise every "Join the Ohana" submission redirects to /locked
  // and fetch sees an HTML body, surfacing as a generic error to the user.
  "/api/subscribe",
];

function isBypassPath(pathname: string): boolean {
  return LOCK_BYPASS_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

/**
 * Middleware — two responsibilities:
 *  1. Site-wide lock: redirect to /locked unless the r1p_site_unlocked cookie is set.
 *  2. Account protection: redirect unauthenticated users away from /account/*.
 */
export default auth(async (req) => {
  const { pathname } = req.nextUrl;

  // ── 1. Site-wide lock ────────────────────────────────────────────
  if (!isBypassPath(pathname)) {
    const cookie = req.cookies.get(SITE_UNLOCK_COOKIE);
    if (!(await isValidSiteUnlockCookieValue(cookie?.value))) {
      return NextResponse.redirect(new URL("/locked", req.nextUrl.origin));
    }
  }

  // ── 2. Account route protection ──────────────────────────────────
  const isLoggedIn = !!req.auth;
  const isPublicAccountRoute = pathname === "/account/login" || pathname === "/account/register";

  if (!isLoggedIn && pathname.startsWith("/account") && !isPublicAccountRoute) {
    const loginUrl = new URL("/account/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && isPublicAccountRoute) {
    return NextResponse.redirect(new URL("/account", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match ALL routes EXCEPT:
     *  - /_next/* (Next.js internals — static chunks, HMR, image optimizer)
     *  - /favicon.ico
     *  - /images/* and /assets/* (public directory assets)
     *  - Any path ending in a static file extension
     *
     * This ensures the site-lock check runs on every page and API route
     * while never blocking static assets (which would break the lock page itself).
     */
    "/((?!_next/|favicon\\.ico|images/|assets/|riplogo\\.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf|eot)).*)",
  ],
};
