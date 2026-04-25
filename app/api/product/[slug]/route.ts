import { type NextRequest, NextResponse } from "next/server";
import { getCatalog } from "@/lib/catalog";
import { fail, ok } from "@/lib/api";

/**
 * GET /api/product/[slug]
 * Returns the full normalised `Product` (including attributes + variations)
 * for client-side surfaces that only have a `ProductSummary` to start with —
 * e.g. the Quick Add modal launched from a product card.
 *
 * Notes:
 *  - Light-weight: no auth / cookies needed; this is the same data the public
 *    PDP is built from.
 *  - Cached at the edge for 60s — the listing pages already use the same
 *    catalog source so this stays cheap.
 *  - Returns NOT_FOUND (404) if the slug doesn't resolve, so the client UI
 *    can degrade to a "View full details" link.
 */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ slug: string }> },
): Promise<NextResponse> {
  const { slug } = await ctx.params;

  if (!slug || typeof slug !== "string" || slug.length > 200) {
    return NextResponse.json(fail("VALIDATION_FAILED", "Invalid product slug"), { status: 422 });
  }

  try {
    const product = await getCatalog().getProductBySlug(slug);
    if (!product) {
      return NextResponse.json(fail("NOT_FOUND", "Product not found"), { status: 404 });
    }
    return NextResponse.json(ok(product), {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(fail("BACKEND_OFFLINE", message), { status: 503 });
  }
}

export const dynamic = "force-dynamic";
