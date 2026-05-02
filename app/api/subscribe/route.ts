import { z } from "zod";
import { withApi } from "@/lib/api";
import { subscribeToList } from "@/lib/email";
import { ApiError } from "@/lib/api/errors";
import { env } from "@/lib/env";

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
    const listId = env.KLAVIYO_LIST_ID;
    if (!listId) {
      throw new ApiError({
        code: "EMAIL_NOT_CONFIGURED",
        message: "Email service unavailable. Please try again.",
        status: 503,
      });
    }

    const result = await subscribeToList(
      listId,
      { email: input.email },
      "newsletter_form",
    );

    if (!result.ok) {
      throw new ApiError({
        code: "EMAIL_PROVIDER_ERROR",
        message: "Email service unavailable. Please try again.",
        status: 502,
      });
    }

    return {
      subscribed: true,
      alreadySubscribed: result.alreadySubscribed === true,
    };
  },
});
