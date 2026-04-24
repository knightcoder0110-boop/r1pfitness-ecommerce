import { z } from "zod";
import { withApi } from "@/lib/api";
import { subscribeToKlaviyo } from "@/lib/klaviyo";
import { ApiError } from "@/lib/api/errors";

const SubscribeSchema = z.object({
  email: z.string().email("Valid email address required"),
});

/**
 * POST /api/newsletter/subscribe  (also aliased at /api/subscribe for back-compat)
 *
 * Subscribes an email to the Klaviyo list configured by KLAVIYO_LIST_ID.
 * Returns the standard {ok, data} BFF envelope.
 *
 * Rate limited: 10 attempts / 5 min / IP to prevent list-stuffing.
 */
export const POST = withApi({
  schema: SubscribeSchema,
  rateLimit: { max: 10, windowMs: 5 * 60_000 },
  handler: async ({ input }) => {
    const result = await subscribeToKlaviyo(input.email);

    if (!result.success) {
      throw new ApiError({
        code: "KLAVIYO_ERROR",
        message: result.error ?? "Email service unavailable. Please try again.",
        status: 502,
      });
    }

    return { subscribed: true };
  },
});
