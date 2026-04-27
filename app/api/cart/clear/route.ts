import { withApi, ApiError } from "@/lib/api";
import { clearCart } from "@/lib/woo/cart";

export const dynamic = "force-dynamic";

export const POST = withApi({
  rateLimit: { max: 10, windowMs: 60_000 },
  handler: async () => {
    if (!process.env.WOO_BASE_URL) {
      throw new ApiError({
        code: "BACKEND_OFFLINE",
        message: "Cart backend is not configured",
        status: 503,
      });
    }

    return clearCart();
  },
});