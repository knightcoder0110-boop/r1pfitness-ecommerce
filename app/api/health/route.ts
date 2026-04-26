import { NextResponse } from "next/server";

// Always re-evaluate so the timestamp reflects actual request time.
export const dynamic = "force-dynamic";

/**
 * Lightweight health probe used by uptime monitors (BetterStack etc.).
 * No DB or Woo round-trip — a failure here means Vercel itself is down.
 * Bypasses the site-wide password lock via LOCK_BYPASS_PREFIXES.
 */
export function GET() {
  return NextResponse.json(
    {
      ok: true,
      ts: Date.now(),
      rev: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev",
      env: process.env.VERCEL_ENV ?? "local",
    },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
