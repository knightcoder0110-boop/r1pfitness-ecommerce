import { NextResponse } from "next/server";

// Always re-evaluate so the timestamp reflects actual request time.
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ ok: true, ts: Date.now() });
}
