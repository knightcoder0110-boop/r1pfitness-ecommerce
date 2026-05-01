import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type * as CheckoutModule from "@/lib/checkout";
import type * as PaymentsModule from "@/lib/payments";

vi.mock("server-only", () => ({}));

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const getCart = vi.hoisted(() => vi.fn());
const hasFreeShippingCoupon = vi.hoisted(() => vi.fn());
const createWooOrder = vi.hoisted(() => vi.fn());
const createIntent = vi.hoisted(() => vi.fn());
const auth = vi.hoisted(() => vi.fn());
const checkRateLimit = vi.hoisted(() =>
  vi.fn(() => ({ ok: true, resetAt: Date.now() + 60_000 })),
);

vi.mock("@/lib/woo/cart", () => ({
  getCart,
  hasFreeShippingCoupon,
}));

vi.mock("@/lib/checkout", async () => {
  const actual = await vi.importActual<typeof CheckoutModule>("@/lib/checkout");
  return {
    ...actual,
    createWooOrder,
  };
});

vi.mock("@/lib/payments", async () => {
  const actual = await vi.importActual<typeof PaymentsModule>("@/lib/payments");
  return {
    ...actual,
    getPaymentProvider: () => ({
      name: "stripe" as const,
      createIntent,
      retrieveIntent: vi.fn(),
      parseWebhook: vi.fn(),
    }),
  };
});

vi.mock("@/auth", () => ({ auth }));
vi.mock("@/lib/api/ratelimit", () => ({ checkRateLimit }));
vi.mock("@/lib/api/request-security", () => ({
  assertSameOrigin: () => {},
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const KEY_A = "11111111-1111-4111-8111-111111111111";
const KEY_B = "22222222-2222-4222-8222-222222222222";

function makeServerCart(overrides: Partial<ReturnType<typeof baseCart>> = {}) {
  return { ...baseCart(), ...overrides } as unknown as Awaited<
    ReturnType<typeof getCart>
  >;
}

function baseCart() {
  return {
    items: [
      {
        key: "42::420",
        productId: "42",
        variationId: "420",
        name: "Paradise Tee",
        sku: "PT-BLK-M",
        quantity: 2,
        unitPrice: { amount: 6500, currency: "USD" },
        subtotal: { amount: 13000, currency: "USD" },
        attributes: { pa_size: "M" },
      },
    ],
    coupons: [] as Array<{ code: string; freeShipping?: boolean }>,
    discountTotal: { amount: 0, currency: "USD" },
    subtotal: { amount: 13000, currency: "USD" },
    total: { amount: 13000, currency: "USD" },
    currency: "USD",
  };
}

function makeBody(overrides: Record<string, unknown> = {}) {
  return {
    email: "kai@example.com",
    billing: {
      firstName: "Kai",
      lastName: "Aloha",
      line1: "91-000 Farrington Hwy",
      city: "Waipahu",
      region: "HI",
      postalCode: "96797",
      country: "US",
    },
    idempotencyKey: KEY_A,
    ...overrides,
  };
}

function mkRequest(body: unknown): Request {
  return new Request("http://localhost/api/checkout/express", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
      host: "localhost",
    },
    body: JSON.stringify(body),
  });
}

beforeEach(async () => {
  getCart.mockReset();
  hasFreeShippingCoupon.mockReset().mockResolvedValue(false);
  createWooOrder.mockReset();
  createIntent.mockReset();
  auth.mockReset().mockResolvedValue(null);
  checkRateLimit.mockReset().mockReturnValue({ ok: true, resetAt: Date.now() + 60_000 });
  getCart.mockResolvedValue(makeServerCart());

  const cache = await import("@/lib/payments/intent-cache");
  cache.__resetIntentCacheForTesting();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("POST /api/checkout/express — happy path", () => {
  it("creates a Woo order + Stripe intent from the server cart and returns clientSecret", async () => {
    createWooOrder.mockResolvedValue({
      orderId: "1042",
      orderKey: "wc_order_abc",
      totalCents: 14000, // 13000 subtotal + 1000 shipping
    });
    createIntent.mockResolvedValue({
      providerIntentId: "pi_test",
      confirmationToken: "pi_test_secret",
      amount: 14000,
      currency: "usd",
    });

    const { POST } = await import("./route");
    const res = await POST(mkRequest(makeBody()) as never);
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.ok).toBe(true);
    expect(j.data).toMatchObject({
      orderId: "1042",
      orderKey: "wc_order_abc",
      clientSecret: "pi_test_secret",
      totalAmount: 14000,
      currency: "USD",
    });

    // Trusted items came from the server cart, not the request body.
    expect(createWooOrder).toHaveBeenCalledTimes(1);
    const [reqArg, shippingCents] = createWooOrder.mock.calls[0]!;
    expect(reqArg.items).toHaveLength(1);
    expect(reqArg.items[0]).toMatchObject({
      productId: "42",
      variationId: "420",
      quantity: 2,
      unitPrice: { amount: 6500, currency: "USD" },
    });
    expect(shippingCents).toBe(1000); // below $150 threshold

    // PaymentIntent tagged as express checkout for analytics.
    expect(createIntent.mock.calls[0]![0]).toMatchObject({
      orderId: "1042",
      amount: 14000,
      metadata: { source: "express_checkout" },
    });
  });

  it("falls back to billing when shipping is omitted", async () => {
    createWooOrder.mockResolvedValue({ orderId: "1", totalCents: 14000 });
    createIntent.mockResolvedValue({
      providerIntentId: "pi_x",
      confirmationToken: "pi_x_secret",
      amount: 14000,
      currency: "usd",
    });

    const { POST } = await import("./route");
    const res = await POST(mkRequest(makeBody()) as never);
    expect(res.status).toBe(200);

    const reqArg = createWooOrder.mock.calls[0]![0];
    expect(reqArg.shipping).toEqual(reqArg.billing);
  });

  it("uses zero shipping when the server cart carries a free-shipping coupon", async () => {
    getCart.mockResolvedValue(
      makeServerCart({
        coupons: [{ code: "freeshipnew", freeShipping: true }],
      }),
    );
    hasFreeShippingCoupon.mockResolvedValue(true);
    createWooOrder.mockResolvedValue({ orderId: "1", totalCents: 13000 });
    createIntent.mockResolvedValue({
      providerIntentId: "pi_y",
      confirmationToken: "pi_y_secret",
      amount: 13000,
      currency: "usd",
    });

    const { POST } = await import("./route");
    const res = await POST(mkRequest(makeBody()) as never);
    expect(res.status).toBe(200);
    const [, shippingCents] = createWooOrder.mock.calls[0]!;
    expect(shippingCents).toBe(0);
    expect(createIntent.mock.calls[0]![0]!.amount).toBe(13000);
  });
});

describe("POST /api/checkout/express — security & validation", () => {
  it("rejects missing billing address with 422", async () => {
    const { POST } = await import("./route");
    const res = await POST(mkRequest({ email: "x@y.com" }) as never);
    expect(res.status).toBe(422);
    expect(createWooOrder).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON with 400", async () => {
    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/checkout/express", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://localhost" },
      body: "not-json",
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });

  it("rejects invalid email with 422", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      mkRequest(makeBody({ email: "not-an-email" })) as never,
    );
    expect(res.status).toBe(422);
  });

  it("returns 409 when server cart is empty (no items)", async () => {
    getCart.mockResolvedValue(makeServerCart({ items: [] }));
    const { POST } = await import("./route");
    const res = await POST(mkRequest(makeBody()) as never);
    expect(res.status).toBe(409);
    expect(createWooOrder).not.toHaveBeenCalled();
  });

  it("returns 502 when getCart throws", async () => {
    getCart.mockRejectedValue(new Error("woo down"));
    const { POST } = await import("./route");
    const res = await POST(mkRequest(makeBody()) as never);
    expect(res.status).toBe(502);
    expect(createWooOrder).not.toHaveBeenCalled();
  });

  it("returns 429 when rate-limited", async () => {
    checkRateLimit.mockReturnValue({ ok: false, resetAt: Date.now() + 30_000 });
    const { POST } = await import("./route");
    const res = await POST(mkRequest(makeBody()) as never);
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBeTruthy();
  });

  it("does NOT trust client items — body items are ignored", async () => {
    createWooOrder.mockResolvedValue({ orderId: "1", totalCents: 14000 });
    createIntent.mockResolvedValue({
      providerIntentId: "pi_z",
      confirmationToken: "pi_z_secret",
      amount: 14000,
      currency: "usd",
    });

    const { POST } = await import("./route");
    // Even if the client tries to inject a fake $1 item, the server cart wins.
    const evilBody = makeBody({
      items: [
        {
          productId: "999",
          quantity: 1,
          unitPrice: { amount: 100, currency: "USD" },
          name: "EVIL CHEAP",
          sku: "EVIL",
          attributes: {},
        },
      ],
    });
    const res = await POST(mkRequest(evilBody) as never);
    expect(res.status).toBe(200);
    const reqArg = createWooOrder.mock.calls[0]![0];
    expect(reqArg.items).toHaveLength(1);
    expect(reqArg.items[0].productId).toBe("42"); // server cart product
    expect(reqArg.items[0].unitPrice.amount).toBe(6500);
  });
});

describe("POST /api/checkout/express — idempotency", () => {
  it("collapses two sequential submits with the same key into one Woo order + one PI", async () => {
    createWooOrder.mockResolvedValue({
      orderId: "1042",
      orderKey: "wc_order_abc",
      totalCents: 14000,
    });
    createIntent.mockResolvedValue({
      providerIntentId: "pi_test",
      confirmationToken: "pi_test_secret",
      amount: 14000,
      currency: "usd",
    });

    const { POST } = await import("./route");
    const r1 = await POST(mkRequest(makeBody()) as never);
    const r2 = await POST(mkRequest(makeBody()) as never);

    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
    expect(createWooOrder).toHaveBeenCalledTimes(1);
    expect(createIntent).toHaveBeenCalledTimes(1);
    expect(createIntent.mock.calls[0]![0]).toMatchObject({ idempotencyKey: KEY_A });
  });

  it("creates a separate order for a different idempotency key", async () => {
    createWooOrder
      .mockResolvedValueOnce({ orderId: "1", totalCents: 14000 })
      .mockResolvedValueOnce({ orderId: "2", totalCents: 14000 });
    createIntent
      .mockResolvedValueOnce({
        providerIntentId: "pi_1",
        confirmationToken: "s1",
        amount: 14000,
        currency: "usd",
      })
      .mockResolvedValueOnce({
        providerIntentId: "pi_2",
        confirmationToken: "s2",
        amount: 14000,
        currency: "usd",
      });

    const { POST } = await import("./route");
    await POST(mkRequest(makeBody({ idempotencyKey: KEY_A })) as never);
    await POST(mkRequest(makeBody({ idempotencyKey: KEY_B })) as never);
    expect(createWooOrder).toHaveBeenCalledTimes(2);
    expect(createIntent).toHaveBeenCalledTimes(2);
  });
});

describe("POST /api/checkout/express — Woo total floor guard", () => {
  it("returns 502 when Woo total is below subtotal + shipping (price drift)", async () => {
    createWooOrder.mockResolvedValue({
      orderId: "1",
      totalCents: 5000, // suspiciously low — below 13000 + 1000 floor
    });
    createIntent.mockResolvedValue({
      providerIntentId: "pi_x",
      confirmationToken: "s",
      amount: 5000,
      currency: "usd",
    });

    const { POST } = await import("./route");
    const res = await POST(mkRequest(makeBody()) as never);
    expect(res.status).toBe(502);
    // Critically, Stripe was NOT charged.
    expect(createIntent).not.toHaveBeenCalled();
  });
});
