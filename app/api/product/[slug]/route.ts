import { type NextRequest, NextResponse } from "next/server";
import { getCatalog } from "@/lib/catalog";
import { fail, ok } from "@/lib/api";

/**
 * GET /api/product/[slug]
 * Returns the full normalised `Product` (including attributes + variations)
 * for client-side surfaces that only have a `ProductSummary` to start with —
 * e.g. the Quick Add modal launched from a product card.
 *
 * Caching notes:
 *  - Do NOT set `force-dynamic` here — that opts all fetch() calls in this
 *    route out of the Next.js Data Cache, making every hit go to WooCommerce.
 *  - The underlying Woo fetch helpers already carry `next: { revalidate: 300 }`
 *    so they use the Data Cache automatically.
 *  - We also send public browser-cache headers so repeated opens of the same
 *    product's Quick Add modal skip the network entirely on the client side.
 */

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ slug: string }> },
): Promise<NextResponse> {
  const { slug } = await ctx.params;

  if (!slug || typeof slug !== "string" || slug.length > 200) {
    return NextResponse.json(fail("VALIDATION_FAILED", "Invalid product slug"), { status: 422 });
  }

  // Optional `?id=` hint from the caller (Quick Add trigger sends the numeric
  // product ID it already has from the listing surface). When present we pass
  // it through so the catalog can parallelise the slug + variations fetches
  // — cuts cold-cache Quick Add latency roughly in half. We validate strictly:
  // numeric only, max 12 digits, otherwise dropped.
  const idHintRaw = req.nextUrl.searchParams.get("id");
  const idHint =
    idHintRaw && /^[0-9]{1,12}$/.test(idHintRaw) ? idHintRaw : undefined;

  try {
    const product = await getCatalog().getProductBySlug(
      slug,
      idHint ? { productId: idHint } : undefined,
    );
    if (!product) {
      return NextResponse.json(fail("NOT_FOUND", "Product not found"), { status: 404 });
    }
    return NextResponse.json(ok(product), {
      headers: {
        // Let the browser cache for 60s and serve stale up to 5 min while revalidating.
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(fail("BACKEND_OFFLINE", message), { status: 503 });
  }
}
