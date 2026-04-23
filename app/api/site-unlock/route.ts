import { NextResponse } from "next/server";

const COOKIE_NAME = "r1p_site_unlocked";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function POST(request: Request) {
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

  // SITE_UNLOCK_PASSWORD is server-side only — never exposed in the client bundle.
  // Falls back to the drop password if not set (for convenience during dev).
  const correctPassword =
    process.env.SITE_UNLOCK_PASSWORD || process.env.NEXT_PUBLIC_DROP_PASSWORD;

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
