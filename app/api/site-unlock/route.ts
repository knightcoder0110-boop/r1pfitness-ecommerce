import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/api/ratelimit";

const COOKIE_NAME = "r1p_site_unlocked";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function POST(request: Request) {
  // Rate limit before touching the body. 5 attempts / 10 min / IP is
  // aggressive enough to make brute-force impractical while still allowing
  // a legitimate user a few typos.
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const rl = checkRateLimit(`site-unlock:${ip}`, {
    max: 5,
    windowMs: 10 * 60_000,
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
    return NextResponse.json(
      { ok: false, error: "Site lock is not configured." },
      { status: 503 },
    );
  }

  if (password !== correctPassword) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });

  response.cookies.set(COOKIE_NAME, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  return response;
}
