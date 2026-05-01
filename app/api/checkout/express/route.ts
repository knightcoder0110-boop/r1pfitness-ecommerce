import { NextResponse, type NextRequest } from "next/server";
import { z, type ZodError } from "zod";
import { auth } from "@/auth";
import {
  AddressSchema,
  computeOrderTotal,
  createWooOrder,
  type CheckoutRequest,
  type CheckoutResult,
} from "@/lib/checkout";
import { calculateShippingCents } from "@/lib/constants/shipping";
import { assertSameOrigin } from "@/lib/api/request-security";
import { checkRateLimit } from "@/lib/api/ratelimit";
import { getPaymentProvider } from "@/lib/payments";
import { getOrCreate, isValidIdempotencyKey } from "@/lib/payments/intent-cache";
import { getCart, hasFreeShippingCoupon } from "@/lib/woo/cart";

/**
 * POST /api/checkout/express
 *
 * Express Checkout entry point — Apple Pay / Google Pay / Link.
 *
 * DEPLOYMENT — Apple Pay domain verification:
 *   1. Stripe Dashboard → Settings → Payment methods → Apple Pay → Add domain.
 *   2. Copy the verification file contents into
 *      `public/.well-known/apple-developer-merchantid-domain-association`.
 *   3. Deploy. The site-lock middleware bypass for `/.well-known` is already
 *      configured in `middleware.ts`. Click "Verify" in Stripe Dashboard.
 *   Apple Pay does NOT work on localhost — use Google Pay / Link to test.
 *
 * Unlike `/api/checkout`, the wallet sheet collects the email + shipping
 * address client-side from the OS wallet itself, so the request body is
 * MUCH smaller. There is no client-supplied items array — the server
 * cart (keyed by the httpOnly `r1p_cart_token` cookie) is the ONLY
 * source of truth for what gets charged.
 *
 * SECURITY — trust boundary:
 *   The browser ships:
 *     - email
 *     - billing  (from the wallet's billing contact)
 *     - shipping (from the wallet's shipping contact, falls back to billing)
 *     - idempotencyKey (UUID v4, generated per click)
 *   We do NOT accept items, prices, totals, or coupons from the client.
 *   Coupons are read from the server cart only.
 *
 * Flow:
 *  1. Same-origin guard, rate limit, Zod validation.
 *  2. Load server cart. Reject if empty.
 *  3. Compute subtotal, discount, free-shipping, shipping from server cart.
 *  4. Create Woo order (pending), create Stripe PaymentIntent.
 *  5. Return { clientSecret, orderId, orderKey, totalAmount, currency }.
 *
 * The browser then calls `stripe.confirmPayment({ elements, clientSecret })`
 * to drive the wallet sheet to completion. The Stripe webhook handles
 * `payment_intent.succeeded` exactly as for the standard flow — there is
 * no separate post-payment plumbing.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  assertSameOrigin(req);

  // Rate limit: 5 attempts per IP per minute (matches /api/checkout).
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const rl = checkRateLimit(`checkout-express:${ip}`, { max: 5, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests — please slow down" },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
      },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = ExpressCheckoutRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: formatZodError(parsed.error) },
      { status: 422 },
    );
  }

  const data = parsed.data;

  // ── Load authoritative server cart ───────────────────────────────────
  let serverCart: Awaited<ReturnType<typeof getCart>>;
  try {
    serverCart = await getCart();
  } catch (err) {
    console.error("[checkout-express] Failed to load server cart:", err);
    return NextResponse.json(
      { error: "Could not load your cart. Please refresh and try again." },
      { status: 502 },
    );
  }

  if (!serverCart.items.length) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 409 });
  }

  // ── Build trusted checkout request from server cart ─────────────────
  const trustedItems: CheckoutRequest["items"] = serverCart.items.map((li) => ({
    productId: li.productId,
    ...(li.variationId ? { variationId: li.variationId } : {}),
    quantity: li.quantity,
    unitPrice: li.unitPrice,
    name: li.name,
    sku: li.sku,
    attributes: li.attributes,
  }));

  const serverCouponCodes = serverCart.coupons.map((coupon) => coupon.code);
  const trustedRequest: CheckoutRequest = {
    email: data.email,
    billing: data.billing,
    shipping: data.shipping ?? data.billing,
    items: trustedItems,
    coupons: serverCouponCodes,
  };

  const subtotalCents = computeOrderTotal(trustedItems);
  if (subtotalCents <= 0) {
    return NextResponse.json({ error: "Order total must be > 0" }, { status: 422 });
  }

  const discountCents = serverCart.discountTotal.amount;
  const discountedSubtotalCents = Math.max(0, subtotalCents - discountCents);
  const freeShipping =
    serverCouponCodes.length > 0 && (await hasFreeShippingCoupon(serverCouponCodes));
  const shippingCents = freeShipping ? 0 : calculateShippingCents(discountedSubtotalCents);
  const currency = serverCart.currency;
  const session = await auth();
  const customerId =
    session?.user.wooCustomerId && session.user.wooCustomerId !== "0"
      ? session.user.wooCustomerId
      : undefined;

  const idempotencyKey = data.idempotencyKey;

  const work = async (): Promise<{
    orderId: string;
    orderKey?: string;
    totalAmount: number;
    clientSecret: string;
  }> => {
    const { orderId, orderKey, totalCents } = await createWooOrder(
      trustedRequest,
      shippingCents,
      customerId,
    );

    const expectedFloor = discountedSubtotalCents + shippingCents;
    if (totalCents < expectedFloor) {
      console.error(
        `[checkout-express] Woo total ${totalCents} below expected floor ${expectedFloor} for order ${orderId}`,
      );
      throw new CheckoutFloorError();
    }

    const intent = await getPaymentProvider().createIntent({
      amount: totalCents,
      currency,
      orderId,
      email: data.email,
      ...(idempotencyKey ? { idempotencyKey } : {}),
      metadata: { source: "express_checkout" },
    });

    return {
      orderId,
      ...(orderKey ? { orderKey } : {}),
      totalAmount: totalCents,
      clientSecret: intent.confirmationToken,
    };
  };

  let out: {
    orderId: string;
    orderKey?: string;
    totalAmount: number;
    clientSecret: string;
  };
  try {
    out =
      idempotencyKey && isValidIdempotencyKey(idempotencyKey)
        ? await getOrCreate(idempotencyKey, work)
        : await work();
  } catch (err) {
    if (err instanceof CheckoutFloorError) {
      return NextResponse.json(
        { error: "Order total mismatch. Please refresh and try again." },
        { status: 502 },
      );
    }
    console.error("[checkout-express] order/intent creation failed:", err);
    return NextResponse.json(
      { error: "Could not initialise payment. Please try again." },
      { status: 502 },
    );
  }

  const result: CheckoutResult = {
    clientSecret: out.clientSecret,
    orderId: out.orderId,
    ...(out.orderKey ? { orderKey: out.orderKey } : {}),
    totalAmount: out.totalAmount,
    currency,
  };
  return NextResponse.json({ ok: true, data: result }, { status: 200 });
}

// ---------------------------------------------------------------------------
// Schema — wallet payload only. No items, no prices.
// ---------------------------------------------------------------------------

const ExpressCheckoutRequestSchema = z.object({
  email: z.string().email("Valid email required"),
  billing: AddressSchema,
  shipping: AddressSchema.optional(),
  idempotencyKey: z
    .string()
    .regex(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      "Invalid idempotency key",
    )
    .optional(),
});

class CheckoutFloorError extends Error {
  constructor() {
    super("Woo total below expected floor");
    this.name = "CheckoutFloorError";
  }
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
