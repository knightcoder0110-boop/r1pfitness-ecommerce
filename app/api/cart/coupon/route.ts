import { z } from "zod";
import { withApi, ApiError } from "@/lib/api";
import { applyCoupon, removeCoupon } from "@/lib/woo/cart";

const schema = z.object({
  code: z.string().min(1).max(64),
  action: z.enum(["apply", "remove"]).default("apply"),
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
    return input.action === "remove"
      ? removeCoupon(input.code)
      : applyCoupon(input.code);
  },
});
