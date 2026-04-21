import { NextResponse } from "next/server";
import type { ZodError } from "zod";
import {
  CheckoutRequestSchema,
  type CheckoutResult,
  computeOrderTotal,
  createPaymentIntent,
  createWooOrder,
} from "@/lib/checkout";

/**
 * POST /api/checkout
 *
 * Accepts a serialised cart + address, creates a WooCommerce order (pending),
 * and returns a Stripe PaymentIntent client_secret for the client to confirm.
 *
 * Flow:
 *  1. Validate request body with Zod.
 *  2. Compute order total from line items (server-side, not trusted client total).
 *  3. Create Woo order → orderId.
 *  4. Create Stripe PaymentIntent with metadata.orderId.
 *  5. Return { clientSecret, orderId, totalAmount, currency }.
 *
 * The Stripe webhook (app/api/webhooks/stripe/route.ts) listens for
 * `payment_intent.succeeded` and transitions the Woo order to "processing".
 */
export async function POST(req: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = CheckoutRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: formatZodError(parsed.error) },
      { status: 422 },
    );
  }

  const data = parsed.data;

  // Compute total server-side — never trust client-supplied total.
  const totalAmount = computeOrderTotal(
    data.items as Parameters<typeof computeOrderTotal>[0],
  );
  if (totalAmount <= 0) {
    return NextResponse.json({ error: "Order total must be > 0" }, { status: 422 });
  }

  const currency = data.items[0]!.unitPrice.currency;

  // Create Woo order (pending, not yet paid).
  let orderId: string;
  try {
    const result = await createWooOrder(data);
    orderId = result.orderId;
  } catch (err) {
    console.error("[checkout] Woo order creation failed:", err);
    return NextResponse.json(
      { error: "Could not create order. Please try again." },
      { status: 502 },
    );
  }

  // Create Stripe PaymentIntent.
  let clientSecret: string;
  try {
    const intent = await createPaymentIntent(totalAmount, currency, {
      orderId,
      email: data.email,
    });
    clientSecret = intent.client_secret!;
  } catch (err) {
    console.error("[checkout] Stripe PaymentIntent creation failed:", err);
    return NextResponse.json(
      { error: "Could not initialise payment. Please try again." },
      { status: 502 },
    );
  }

  const result: CheckoutResult = { clientSecret, orderId, totalAmount, currency };
  return NextResponse.json(result, { status: 200 });
}

function formatZodError(err: ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".");
    out[key] ??= [];
    out[key]!.push(issue.message);
  }
  return out;
}
