import { z } from "zod";
import { withApi, ApiError } from "@/lib/api";
import { updateCartItem } from "@/lib/woo/cart";

const schema = z.object({
  key: z.string().min(1).max(256),
  quantity: z.number().int().min(0).max(99),
});

export const dynamic = "force-dynamic";

export const POST = withApi({
  schema,
  handler: async ({ input }) => {
    if (!process.env.WOO_BASE_URL) {
      throw new ApiError({
        code: "BACKEND_OFFLINE",
        message: "Cart backend is not configured",
        status: 503,
      });
    }
    return updateCartItem(input);
  },
});
