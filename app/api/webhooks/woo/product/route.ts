import { type NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { WOO_TAGS } from "@/lib/woo/products";

/**
 * WooCommerce product webhook.
 *
 * Configure in WP admin → WooCommerce → Settings → Advanced → Webhooks:
 *   - Topic: Product created / updated / deleted
 *   - Delivery URL: https://<host>/api/webhooks/woo/product
 *   - Secret: same value as WOO_WEBHOOK_SECRET env var
 *
 * WooCommerce signs each delivery with HMAC-SHA256 over the raw body and
 * sends the result in the `x-wc-webhook-signature` header (base64).
 *
 * Security:
 *  - Raw body is required BEFORE JSON.parse (signature is over bytes).
 *  - Timing-safe comparison prevents timing attacks on the secret.
 *  - Missing/invalid signature → 401 with no body detail.
 *  - No DB writes here — purely cache invalidation.
 *  - Idempotent: replaying the same payload produces the same tags.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface WooWebhookPayload {
  id?: number;
  slug?: string;
  // Plus many more fields we don't need for revalidation.
}

function verifySignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;

  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");

  // Both strings must be equal length for timingSafeEqual; base64 from HMAC-SHA256 is always 44 chars.
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
    // We refuse to accept webhooks until the secret is set. Better to
    // respond 503 than silently skip signature checks.
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

  // Signature valid — parse the body.
  let payload: WooWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as WooWebhookPayload;
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_FAILED", message: "Malformed webhook body" } },
      { status: 400 },
    );
  }

  const tags: string[] = [WOO_TAGS.products, WOO_TAGS.categories];
  if (typeof payload.id === "number") {
    tags.push(WOO_TAGS.product(String(payload.id)));
    tags.push(WOO_TAGS.variations(String(payload.id)));
  }
  if (typeof payload.slug === "string" && payload.slug) {
    tags.push(WOO_TAGS.productBySlug(payload.slug));
  }

  for (const tag of tags) {
    try {
      // Next 16 requires a cacheLife profile argument; "default" is the
      // standard profile and triggers immediate expiry for the given tag.
      revalidateTag(tag, "default");
    } catch {
      // revalidateTag throws outside a request scope in rare cases; ignore
      // so a single bad tag doesn't fail the whole webhook.
    }
  }

  return NextResponse.json({ ok: true, data: { revalidated: tags } });
}
