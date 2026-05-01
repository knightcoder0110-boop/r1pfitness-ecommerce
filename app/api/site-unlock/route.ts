import { NextResponse } from "next/server";
import { assertSameOrigin } from "@/lib/api/request-security";
import { ApiError } from "@/lib/api/errors";
import { checkRateLimit } from "@/lib/api/ratelimit";
import {
  createSiteUnlockCookieValue,
  SITE_UNLOCK_COOKIE,
  SITE_UNLOCK_COOKIE_MAX_AGE,
} from "@/lib/site-lock-cookie";

export async function POST(request: Request) {
  // assertSameOrigin throws ApiError(403) when the Origin/Referer is missing
  // or cross-origin. Catch it here so the client sees a clean 403 instead of
  // an unhandled 500.
  try {
    assertSameOrigin(request);
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json(
        { ok: false, error: err.message },
        { status: err.status },
      );
    }
    throw err;
  }

  // Rate limit before touching the body. 3 attempts / 15 min / IP is
  // aggressive enough to make brute-force impractical while still allowing
  // a legitimate user a few typos.
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const rl = checkRateLimit(`site-unlock:${ip}`, {
    max: 3,
    windowMs: 15 * 60_000,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many attempts. Try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
        },
      },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    typeof (body as Record<string, unknown>).password !== "string"
  ) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { password } = body as { password: string };

  // SITE_UNLOCK_PASSWORD is server-side only — never exposed in the client
  // bundle. We deliberately do NOT fall back to NEXT_PUBLIC_DROP_PASSWORD:
  // that variable is inlined into client JS at build time, so using it as
  // the gate password would let anyone read it from the bundle.
  const correctPassword = process.env.SITE_UNLOCK_PASSWORD;

  if (!correctPassword) {
    return NextResponse.json({ ok: false, error: "Site lock is not configured." }, { status: 503 });
  }

  if (password !== correctPassword) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });

  let cookieValue: string;
  try {
    cookieValue = await createSiteUnlockCookieValue();
  } catch (error) {
    console.error("[site-unlock] cookie signing secret is not configured:", error);
    return NextResponse.json(
      { ok: false, error: "Site lock cookie signing secret is not configured." },
      { status: 503 },
    );
  }

  response.cookies.set(SITE_UNLOCK_COOKIE, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SITE_UNLOCK_COOKIE_MAX_AGE,
    path: "/",
  });

  return response;
}
