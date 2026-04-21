import { z } from "zod";
import { withApi, ApiError } from "@/lib/api";
import { addCartItem } from "@/lib/woo/cart";

const schema = z.object({
  productId: z.union([z.string(), z.number()]),
  quantity: z.number().int().positive().max(99),
  variation: z
    .array(
      z.object({
        attribute: z.string().min(1).max(128),
        value: z.string().min(1).max(128),
      }),
    )
    .max(20)
    .optional(),
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
    const cart = await addCartItem(input);
    return cart;
  },
});
