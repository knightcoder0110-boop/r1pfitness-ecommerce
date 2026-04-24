import { z } from "zod";
import { withApi } from "@/lib/api";
import { ApiError } from "@/lib/api/errors";

const ContactSchema = z.object({
  name: z.string().min(1, "Name required").max(100),
  email: z.string().email("Valid email required"),
  subject: z.string().min(1, "Subject required").max(200),
  message: z.string().min(10, "Message must be at least 10 characters").max(5000),
});

/**
 * POST /api/contact
 *
 * Sends the contact form payload as an email via a transactional email
 * provider. Currently logs to console (dev-mode stub) and is wired to
 * send via Klaviyo if KLAVIYO_PRIVATE_API_KEY is set.
 *
 * Rate limited: 5 req / 10 min / IP — prevents abuse without blocking
 * legitimate support tickets.
 *
 * TODO: integrate with a transactional email provider (e.g. Resend, SendGrid)
 * or a helpdesk webhook (e.g. Freshdesk, Gorgias) once one is chosen.
 */
export const POST = withApi({
  schema: ContactSchema,
  rateLimit: { max: 5, windowMs: 10 * 60_000 },
  handler: async ({ input }) => {
    const supportEmail = process.env.SUPPORT_EMAIL;

    if (!supportEmail) {
      // Log to server console so messages aren't lost if email isn't
      // configured yet (acceptable during initial launch).
      console.warn("[contact] SUPPORT_EMAIL not set — logging contact form submission:");
      console.warn({
        name: input.name,
        email: input.email,
        subject: input.subject,
        message: input.message.slice(0, 200),
      });
      return { submitted: true };
    }

    // ── Send via Klaviyo transactional email ──────────────────────────
    // Uses the Klaviyo v3 "Send Email" API. Requires a transactional
    // template to be created in Klaviyo; KLAVIYO_CONTACT_TEMPLATE_ID
    // must be set to that template's ID.
    const apiKey = process.env.KLAVIYO_PRIVATE_API_KEY;
    const templateId = process.env.KLAVIYO_CONTACT_TEMPLATE_ID;

    if (!apiKey || !templateId) {
      console.warn("[contact] Klaviyo not fully configured. Logging submission only.");
      console.warn({
        to: supportEmail,
        from: input.email,
        name: input.name,
        subject: input.subject,
      });
      return { submitted: true };
    }

    const res = await fetch("https://a.klaviyo.com/api/emails/", {
      method: "POST",
      headers: {
        Authorization: `Klaviyo-API-Key ${apiKey}`,
        "Content-Type": "application/json",
        revision: "2024-10-15",
      },
      body: JSON.stringify({
        data: {
          type: "email",
          attributes: {
            to: [{ email: supportEmail, name: "R1P Support" }],
            subject: `[R1P Contact] ${input.subject}`,
            template_id: templateId,
            context: {
              sender_name: input.name,
              sender_email: input.email,
              subject: input.subject,
              message: input.message,
            },
          },
        },
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[contact] Klaviyo send failed:", res.status, detail);
      throw new ApiError({
        code: "EMAIL_SEND_FAILED",
        message: "Failed to send your message. Please try again or email us directly.",
        status: 502,
      });
    }

    return { submitted: true };
  },
});
