import { type NextRequest, NextResponse } from "next/server";
import { fail, ok } from "@/lib/api";
import { getQuickAddProduct } from "@/lib/woo/products";

/**
 * GET /api/quick-add/[productId]
 *
 * Purpose-built product payload for the product-card Quick Add modal. It uses
 * the Woo numeric id already present in listing summaries, avoiding a slug
 * lookup and returning only variant-picker/cart fields.
 */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ productId: string }> },
): Promise<NextResponse> {
  const { productId } = await ctx.params;

  if (!/^\d{1,12}$/.test(productId)) {
    return NextResponse.json(fail("VALIDATION_FAILED", "Invalid product id"), { status: 422 });
  }

  try {
    const product = await getQuickAddProduct(productId);
    if (!product) {
      return NextResponse.json(fail("NOT_FOUND", "Product not found"), { status: 404 });
    }

    return NextResponse.json(ok(product), {
      headers: {
        "Cache-Control": "public, max-age=120, stale-while-revalidate=600",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(fail("BACKEND_OFFLINE", message), { status: 503 });
  }
}
