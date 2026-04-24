import { type NextRequest, NextResponse } from "next/server";
import { getCatalog } from "@/lib/catalog";
import { ok, fail } from "@/lib/api/response";
import { checkRateLimit } from "@/lib/api/ratelimit";
import { isMeiliConfigured, getMeiliSearch, MEILI_INDEX, meiliDocumentToSummary } from "@/lib/search/meilisearch";
import type { MeiliProduct } from "@/lib/search/meilisearch";

/**
 * GET /api/search?q=<term>&limit=<n>
 *
 * Lightweight product search endpoint for the search modal.
 * Returns the standard {ok, data} BFF envelope with up to `limit`
 * (default 8, max 20) ProductSummary items and a `total` meta field.
 *
 * Backend selection (automatic, zero config change in UI):
 *  - When MEILI_HOST + MEILI_SEARCH_KEY (or MEILI_MASTER_KEY) are set:
 *    queries Meilisearch (fast, typo-tolerant, ranked).
 *  - Otherwise: falls back to getCatalog().listProducts() (fixture or Woo).
 *
 * Rate limited: 60 req / 60 s / IP.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  // Rate limiting — before any heavy work.
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const rl = checkRateLimit(`search:${ip}`, { max: 60, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(fail("RATE_LIMIT", "Too many requests — please slow down"), {
      status: 429,
      headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
    });
  }

  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q")?.trim() ?? "";
  const limitParam = Number(searchParams.get("limit") ?? 8);
  const pageSize = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 20) : 8;

  if (!q || q.length < 2) {
    return NextResponse.json(ok({ items: [], total: 0 }));
  }

  try {
    if (isMeiliConfigured()) {
      // ── Meilisearch path ────────────────────────────────────────────
      const client = getMeiliSearch();
      const index = client.index<MeiliProduct>(MEILI_INDEX);
      const result = await index.search(q, {
        limit: pageSize,
        attributesToRetrieve: [
          "id", "slug", "name", "priceCents", "compareAtPriceCents",
          "imageUrl", "imageAlt", "inStock", "isLimited",
          "sizeOptions", "colorOptions",
        ],
      });
      const items = result.hits.map(meiliDocumentToSummary);
      return NextResponse.json(ok({ items, total: result.estimatedTotalHits ?? items.length }));
    }

    // ── Catalog fallback path ───────────────────────────────────────
    const catalog = getCatalog();
    const { items, total } = await catalog.listProducts({ search: q, pageSize, page: 1 });
    return NextResponse.json(ok({ items, total }));
  } catch (err) {
    console.error("[/api/search] error:", err);
    return NextResponse.json(fail("SEARCH_ERROR", "Search unavailable"), { status: 500 });
  }
}

// Each request reads live data — never cache.
export const dynamic = "force-dynamic";
