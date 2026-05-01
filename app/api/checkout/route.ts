import { NextResponse, type NextRequest } from "next/server";
import type { ZodError } from "zod";
import { auth } from "@/auth";
import {
  CheckoutRequestSchema,
  type CheckoutRequest,
  type CheckoutResult,
  computeOrderTotal,
  createWooOrder,
} from "@/lib/checkout";
import { calculateShippingCents } from "@/lib/constants/shipping";
import { assertSameOrigin } from "@/lib/api/request-security";
import { checkRateLimit } from "@/lib/api/ratelimit";
import { getPaymentProvider } from "@/lib/payments";
import { getOrCreate, isValidIdempotencyKey } from "@/lib/payments/intent-cache";
import { getCart, hasFreeShippingCoupon } from "@/lib/woo/cart";
import type { CartLineItem } from "@/lib/woo/types";

/**
 * POST /api/checkout
 *
 * Accepts an address + (informational) cart snapshot, cross-checks against
 * the authoritative server cart (via the httpOnly `r1p_cart_token` cookie),
 * creates a WooCommerce order (pending), and returns a Stripe PaymentIntent
 * client_secret for the client to confirm.
 *
 * SECURITY — trust boundary:
 *   The caller is the browser. We do NOT trust any monetary field it sends.
 *   Prices, quantities, totals, and the very list of purchasable items are
 *   all derived from the server-fetched Woo cart keyed by the httpOnly cart
 *   cookie. The client-submitted `items` array is used only to detect
 *   client/server drift (e.g. cart was updated in another tab) and to bail
 *   out before charging the customer an unexpected amount.
 *
 * Flow:
 *  1. Rate-limit per IP.
 *  2. Validate request body with Zod (address + informational items).
 *  3. Load server cart via `getCart()`. Reject if empty.
 *  4. Cross-check client item IDs + quantities against server cart.
 *  5. Compute subtotal from SERVER cart line items.
 *  6. Derive shipping from the discounted subtotal (flat rate vs.
 *     free-over-threshold — single source of truth).
 *  7. Create Woo order with SERVER items + shipping line. Woo calculates
 *     tax based on the billing address + configured tax rates and returns
 *     the final order total (subtotal + shipping + tax).
 *  8. Sanity-check Woo total ≥ discounted subtotal + shipping; else 502.
 *  9. Create Stripe PaymentIntent for the Woo total with
 *     `receipt_email` set so Stripe auto-sends an order confirmation.
 * 10. Return { clientSecret, orderId, totalAmount, currency }.
 *
 * The Stripe webhook (app/api/webhooks/stripe/route.ts) listens for
 * `payment_intent.succeeded` and transitions the Woo order to "processing".
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  assertSameOrigin(req);

  // Rate limit: 5 checkout attempts per IP per minute.
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const rl = checkRateLimit(`checkout:${ip}`, { max: 5, windowMs: 60_000 });
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

  const parsed = CheckoutRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: formatZodError(parsed.error) },
      { status: 422 },
    );
  }

  const data = parsed.data;

  // ── 3. Load the authoritative server cart ────────────────────────────
  // Uses the httpOnly `r1p_cart_token` cookie set by the cart BFF. This is
  // the ONLY source of truth for prices and quantities.
  let serverCart: Awaited<ReturnType<typeof getCart>>;
  try {
    serverCart = await getCart();
  } catch (err) {
    console.error("[checkout] Failed to load server cart:", err);
    return NextResponse.json(
      { error: "Could not load your cart. Please refresh and try again." },
      { status: 502 },
    );
  }

  if (!serverCart.items.length) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 409 });
  }

  // ── 4. Cross-check client items against server cart ──────────────────
  // Any drift — added, removed, or quantity-changed in another tab — aborts
  // with 409 so the client can reload the cart before charging.
  const drift = detectCartDrift(data.items, serverCart.items);
  if (drift) {
    return NextResponse.json(
      { error: "Your cart has changed. Please review it and try again.", reason: drift },
      { status: 409 },
    );
  }

  // ── 5. Build a server-authoritative checkout request ─────────────────
  // Prices, quantities, SKUs, and attributes come from `serverCart`. The
  // client's monetary fields are discarded from this point on. For variable
  // products, Woo Store API cart lines expose the variation id as `id`, so we
  // keep the matched client parent product id for Woo order creation.
  const trustedItems: CheckoutRequest["items"] = serverCart.items.map((li) => ({
    productId: findClientMatchForServerLine(li, data.items)?.productId ?? li.productId,
    variationId: findClientMatchForServerLine(li, data.items)?.variationId ?? li.variationId,
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
    shipping: data.shipping,
    items: trustedItems,
    coupons: serverCouponCodes,
  };

  // Compute subtotal and discount from the server cart (minor units), derive
  // flat-rate shipping from a single source of truth, and let WooCommerce
  // calculate tax server-side based on the billing address. The Woo-returned
  // `total` (subtotal - discount + shipping + tax) is what we charge via Stripe.
  const subtotalCents = computeOrderTotal(trustedItems);
  if (subtotalCents <= 0) {
    return NextResponse.json({ error: "Order total must be > 0" }, { status: 422 });
  }

  const discountCents = serverCart.discountTotal.amount;
  const discountedSubtotalCents = Math.max(0, subtotalCents - discountCents);
  const freeShipping = serverCouponCodes.length > 0
    && await hasFreeShippingCoupon(serverCouponCodes);
  const shippingCents = freeShipping ? 0 : calculateShippingCents(discountedSubtotalCents);
  const currency = serverCart.currency;
  const session = await auth();
  const customerId = session?.user.wooCustomerId && session.user.wooCustomerId !== "0"
    ? session.user.wooCustomerId
    : undefined;

  // Create Woo order (pending, not yet paid) AND Stripe PaymentIntent.
  //
  // Both side-effects are wrapped in the in-memory idempotency cache
  // keyed by the client-supplied UUID. This collapses double-clicks /
  // browser retries / rapid re-submits into a single Woo order + a
  // single PaymentIntent: a second concurrent request awaits the same
  // in-flight Promise, and a follow-up retried HTTP call returns the
  // resolved value. The Stripe-side `idempotencyKey` is a defence-in-
  // depth backstop in case our process-local cache misses (e.g. two
  // different lambdas).
  //
  // When the client omits the key (stale browser tab from before this
  // PR shipped), we fall back to the legacy non-idempotent path so
  // their checkout still works.
  let orderId: string;
  let orderKey: string | undefined;
  let totalAmount: number;
  let clientSecret: string;
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

    // Sanity check: Woo's total must be at least discounted subtotal + shipping.
    const expectedFloor = discountedSubtotalCents + shippingCents;
    if (totalCents < expectedFloor) {
      console.error(
        `[checkout] Woo total ${totalCents} below expected floor ${expectedFloor} for order ${orderId}`,
      );
      throw new CheckoutFloorError();
    }

    const intent = await getPaymentProvider().createIntent({
      amount: totalCents,
      currency,
      orderId,
      email: data.email,
      ...(idempotencyKey ? { idempotencyKey } : {}),
    });
    return {
      orderId,
      ...(orderKey ? { orderKey } : {}),
      totalAmount: totalCents,
      clientSecret: intent.confirmationToken,
    };
  };

  try {
    const out =
      idempotencyKey && isValidIdempotencyKey(idempotencyKey)
        ? await getOrCreate(idempotencyKey, work)
        : await work();
    orderId = out.orderId;
    orderKey = out.orderKey;
    totalAmount = out.totalAmount;
    clientSecret = out.clientSecret;
  } catch (err) {
    if (err instanceof CheckoutFloorError) {
      return NextResponse.json(
        { error: "Order total mismatch. Please refresh and try again." },
        { status: 502 },
      );
    }
    console.error("[checkout] order/intent creation failed:", err);
    return NextResponse.json(
      { error: "Could not initialise payment. Please try again." },
      { status: 502 },
    );
  }

  const result: CheckoutResult = {
    clientSecret,
    orderId,
    ...(orderKey ? { orderKey } : {}),
    totalAmount,
    currency,
  };
  return NextResponse.json({ ok: true, data: result }, { status: 200 });
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

/**
 * Sentinel thrown inside the cached factory when Woo returns a total
 * that is below our computed floor. Caught at the call site to render
 * the user-facing 502 instead of the generic error path.
 */
class CheckoutFloorError extends Error {
  constructor() {
    super("Woo total below expected floor");
    this.name = "CheckoutFloorError";
  }
}

/**
 * Compare the client-submitted items against the server cart.
 *
 * Drift conditions (any one aborts checkout):
 *  - Client has an item not in the server cart, or vice-versa.
 *  - Quantities differ for a matched item.
 *  - A client-submitted unit price does not match the server unit price.
 *
 * Price mismatch is treated as drift rather than silently accepted — a
 * price change between the customer opening the page and clicking "Pay"
 * should re-display the new total before charging.
 *
 * Items are keyed by `productId::variationId` (variationId defaulting to
 * "0" for simple products) so the same product in two variants is not
 * collapsed.
 */
function detectCartDrift(
  clientItems: CheckoutRequest["items"],
  serverItems: CartLineItem[],
): string | null {
  if (clientItems.length !== serverItems.length) {
    return "item_count_mismatch";
  }

  const matchedServerIndexes = new Set<number>();
  for (const ci of clientItems) {
    const matchIndex = serverItems.findIndex(
      (serverItem, index) =>
        !matchedServerIndexes.has(index) && isSameCheckoutLine(ci, serverItem),
    );
    const match = matchIndex >= 0 ? serverItems[matchIndex] : undefined;
    if (!match) return "item_missing_on_server";
    matchedServerIndexes.add(matchIndex);
    if (match.quantity !== ci.quantity) return "quantity_mismatch";
    if (
      match.unitPrice.amount !== ci.unitPrice.amount ||
      match.unitPrice.currency !== ci.unitPrice.currency
    ) {
      return "price_mismatch";
    }
  }

  return null;
}

function findClientMatchForServerLine(
  serverItem: CartLineItem,
  clientItems: CheckoutRequest["items"],
): CheckoutRequest["items"][number] | undefined {
  return clientItems.find((clientItem) => isSameCheckoutLine(clientItem, serverItem));
}

function isSameCheckoutLine(
  clientItem: CheckoutRequest["items"][number],
  serverItem: CartLineItem,
): boolean {
  if (
    serverItem.productId === clientItem.productId &&
    (serverItem.variationId ?? undefined) === clientItem.variationId
  ) {
    return true;
  }

  if (!clientItem.variationId) return false;

  return (
    serverItem.variationId === clientItem.variationId ||
    serverItem.productId === clientItem.variationId
  );
}
