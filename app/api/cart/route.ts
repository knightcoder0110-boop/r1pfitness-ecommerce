import { type NextRequest, NextResponse } from "next/server";
import { getCart } from "@/lib/woo/cart";
import { withApi, fail, ApiError } from "@/lib/api";
import { WooError } from "@/lib/woo/errors";

/**
 * GET /api/cart
 * Returns the current guest cart, creating one on first call.
 * Requires WOO_BASE_URL configured. Returns BACKEND_OFFLINE otherwise.
 */
export async function GET(_req: NextRequest): Promise<NextResponse> {
  if (!process.env.WOO_BASE_URL) {
    return NextResponse.json(
      fail(
        "BACKEND_OFFLINE",
        "Cart backend is not configured. Set WOO_BASE_URL to enable /api/cart.",
      ),
      { status: 503 },
    );
  }
  try {
    const cart = await getCart();
    return NextResponse.json({ ok: true, data: cart });
  } catch (err) {
    if (err instanceof WooError) {
      return NextResponse.json(fail(err.code, err.message, err.details), { status: err.status });
    }
    throw err;
  }
}

// The route uses cookies() so it must be dynamic.
export const dynamic = "force-dynamic";

// Ensure other methods are rejected uniformly.
export const POST = withApi({
  handler: async () => {
    throw new ApiError({
      code: "METHOD_NOT_ALLOWED",
      message: "Use /api/cart/add, /cart/update, /cart/remove, or /cart/coupon",
      status: 405,
    });
  },
});
