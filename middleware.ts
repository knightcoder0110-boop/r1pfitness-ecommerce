import { auth } from "@/auth";
import { NextResponse } from "next/server";

/**
 * Middleware — protects /account/* routes (except /account/login and /account/register).
 * Unauthenticated requests are redirected to /account/login with a `callbackUrl`.
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  const isPublicAccountRoute =
    pathname === "/account/login" || pathname === "/account/register";

  if (!isLoggedIn && pathname.startsWith("/account") && !isPublicAccountRoute) {
    const loginUrl = new URL("/account/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect logged-in users away from login/register
  if (isLoggedIn && isPublicAccountRoute) {
    return NextResponse.redirect(new URL("/account", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/account/:path*"],
};
