import { type NextRequest, NextResponse } from "next/server";
import { getCatalog } from "@/lib/catalog";

/**
 * GET /api/search?q=<term>&limit=<n>
 *
 * Lightweight product search endpoint for the search modal.
 * Returns up to `limit` (default 8, max 20) ProductSummary items.
 * Delegates to the active catalog adapter (WooCommerce in production,
 * fixtures in test/dev without Woo).
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q")?.trim() ?? "";
  const limitParam = Number(searchParams.get("limit") ?? 8);
  const pageSize = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 20) : 8;

  if (!q || q.length < 2) {
    return NextResponse.json({ items: [], total: 0 });
  }

  try {
    const catalog = getCatalog();
    const { items, total } = await catalog.listProducts({ search: q, pageSize, page: 1 });
    return NextResponse.json({ items, total });
  } catch (err) {
    console.error("[/api/search] error:", err);
    return NextResponse.json({ error: "Search unavailable" }, { status: 500 });
  }
}
