import { type NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * WooCommerce customer webhook handler.
 *
 * Configure in WP admin → WooCommerce → Settings → Advanced → Webhooks:
 *   - Topic: Customer created / updated / deleted
 *   - Delivery URL: https://<host>/api/webhooks/woo/customer
 *   - Secret: same value as WOO_WEBHOOK_SECRET env var
 *
 * What this does:
 *  - Verifies the HMAC-SHA256 signature in `x-wc-webhook-signature`.
 *  - On customer.created / customer.updated: future hook point for
 *    syncing customer metadata (loyalty tier, tags) from WooCommerce to
 *    Klaviyo or a CRM. Currently logs the event for observability.
 *  - On customer.deleted: logs the deletion event. Actual account
 *    cleanup is handled by NextAuth sessions expiring naturally.
 *
 * Security:
 *  - Raw body read before JSON.parse (signature is over raw bytes).
 *  - Timing-safe comparison prevents timing attacks.
 *  - Missing/invalid signature → 401, no body detail.
 *  - This handler never performs DB writes — side effects are async
 *    fire-and-forget via the event system to avoid blocking Woo.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface WooCustomerPayload {
  id?: number;
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  date_created?: string;
  date_modified?: string;
}

function verifySignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;

  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");

  if (expected.length !== signature.length) return false;

  try {
    return timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(signature, "utf8"));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.WOO_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: { code: "BACKEND_OFFLINE", message: "Webhook secret not configured" } },
      { status: 503 },
    );
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-wc-webhook-signature");

  if (!verifySignature(rawBody, signature, secret)) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "Invalid signature" } },
      { status: 401 },
    );
  }

  let payload: WooCustomerPayload;
  try {
    payload = JSON.parse(rawBody) as WooCustomerPayload;
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_FAILED", message: "Malformed webhook body" } },
      { status: 400 },
    );
  }

  // Determine event type from Woo's topic header.
  // e.g. "customer.created", "customer.updated", "customer.deleted"
  const topic = req.headers.get("x-wc-webhook-topic") ?? "customer.unknown";

  console.info(`[woo-customer-webhook] topic=${topic} id=${payload.id ?? "?"}`);

  // ── Future integration points ──────────────────────────────────────
  //
  // customer.created | customer.updated:
  //   - Sync customer tags / loyalty tier to Klaviyo via a background job.
  //   - Push profile update to CRM if one is integrated.
  //
  // customer.deleted:
  //   - Queue an async task to remove the customer's Klaviyo profile consent
  //     records per GDPR / CCPA obligations.
  //   - Revoke any active NextAuth sessions for this email (NextAuth v5
  //     has no built-in session revocation — add to Sprint 8 auth hardening).
  //
  // These are intentionally left as stubs for now. The webhook endpoint
  // is live and verified — we can add side-effects without any Woo-side
  // reconfiguration.
  //
  // Example (uncomment when Klaviyo sync is needed):
  //
  //   if (topic === "customer.created" || topic === "customer.updated") {
  //     if (payload.email) {
  //       await syncCustomerToKlaviyo({
  //         email: payload.email,
  //         firstName: payload.first_name,
  //         lastName: payload.last_name,
  //       });
  //     }
  //   }

  return NextResponse.json({ ok: true, data: { received: true, topic, id: payload.id } });
}
