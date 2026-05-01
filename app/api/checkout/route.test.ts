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

function makeServerCart() {
  return {
    items: [
      {
        key: "42::420",
        productId: "42",
        variationId: "420",
        name: "Paradise Tee",
        sku: "PT-BLK-M",
        quantity: 2,
        unitPrice: { amount: 2500, currency: "USD" },
        subtotal: { amount: 5000, currency: "USD" },
        attributes: { pa_size: "M" },
      },
    ],
    coupons: [],
    discountTotal: { amount: 0, currency: "USD" },
    subtotal: { amount: 5000, currency: "USD" },
    total: { amount: 5000, currency: "USD" },
    currency: "USD",
  } as unknown as Awaited<ReturnType<typeof getCart>>;
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
    items: [
      {
        productId: "42",
        variationId: "420",
        quantity: 2,
        unitPrice: { amount: 2500, currency: "USD" },
        name: "Paradise Tee",
        sku: "PT-BLK-M",
        attributes: { pa_size: "M" },
      },
    ],
    idempotencyKey: KEY_A,
    ...overrides,
  };
}

function mkRequest(body: unknown): Request {
  return new Request("http://localhost/api/checkout", {
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

describe("POST /api/checkout — idempotency", () => {
  it("collapses two sequential submits with the same key into one Woo order + one PI", async () => {
    createWooOrder.mockResolvedValue({
      orderId: "1042",
      orderKey: "wc_order_abc",
      totalCents: 6000,
    });
    createIntent.mockResolvedValue({
      providerIntentId: "pi_test",
      confirmationToken: "pi_test_secret",
      amount: 6000,
      currency: "usd",
    });

    const { POST } = await import("./route");

    const r1 = await POST(mkRequest(makeBody()) as never);
    const r2 = await POST(mkRequest(makeBody()) as never);

    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);

    const j1 = await r1.json();
    const j2 = await r2.json();
    expect(j1.data.orderId).toBe("1042");
    expect(j2.data.orderId).toBe("1042");
    expect(j1.data.clientSecret).toBe("pi_test_secret");
    expect(j2.data.clientSecret).toBe("pi_test_secret");

    expect(createWooOrder).toHaveBeenCalledTimes(1);
    expect(createIntent).toHaveBeenCalledTimes(1);

    // Provider receives the idempotency key in the input.
    expect(createIntent.mock.calls[0]![0]).toMatchObject({
      orderId: "1042",
      idempotencyKey: KEY_A,
    });
  });

  it("collapses concurrent submits with the same key into a single in-flight call", async () => {
    let resolveOrder!: (v: { orderId: string; totalCents: number }) => void;
    createWooOrder.mockImplementation(
      () =>
        new Promise((r) => {
          resolveOrder = r;
        }),
    );
    createIntent.mockResolvedValue({
      providerIntentId: "pi_test",
      confirmationToken: "pi_test_secret",
      amount: 6000,
      currency: "usd",
    });

    const { POST } = await import("./route");

    const p1 = POST(mkRequest(makeBody()) as never);
    const p2 = POST(mkRequest(makeBody()) as never);

    // Yield once so both requests reach the cache.
    await new Promise((r) => setTimeout(r, 0));
    expect(createWooOrder).toHaveBeenCalledTimes(1);

    resolveOrder({ orderId: "1042", totalCents: 6000 });
    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
    expect(createWooOrder).toHaveBeenCalledTimes(1);
    expect(createIntent).toHaveBeenCalledTimes(1);
  });

  it("evicts the cache when Woo creation fails so a retry creates a fresh attempt", async () => {
    createWooOrder
      .mockRejectedValueOnce(new Error("woo down"))
      .mockResolvedValueOnce({ orderId: "1042", totalCents: 6000 });
    createIntent.mockResolvedValue({
      providerIntentId: "pi_test",
      confirmationToken: "pi_test_secret",
      amount: 6000,
      currency: "usd",
    });

    const { POST } = await import("./route");

    const r1 = await POST(mkRequest(makeBody()) as never);
    expect(r1.status).toBe(502);

    const r2 = await POST(mkRequest(makeBody()) as never);
    expect(r2.status).toBe(200);

    expect(createWooOrder).toHaveBeenCalledTimes(2);
  });

  it("treats different keys as independent attempts", async () => {
    createWooOrder
      .mockResolvedValueOnce({ orderId: "1042", totalCents: 6000 })
      .mockResolvedValueOnce({ orderId: "1043", totalCents: 6000 });
    createIntent
      .mockResolvedValueOnce({
        providerIntentId: "pi_a",
        confirmationToken: "pi_a",
        amount: 6000,
        currency: "usd",
      })
      .mockResolvedValueOnce({
        providerIntentId: "pi_b",
        confirmationToken: "pi_b",
        amount: 6000,
        currency: "usd",
      });

    const { POST } = await import("./route");
    const r1 = await POST(mkRequest(makeBody()) as never);
    const r2 = await POST(
      mkRequest(makeBody({ idempotencyKey: "22222222-2222-4222-8222-222222222222" })) as never,
    );

    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
    const j1 = await r1.json();
    const j2 = await r2.json();
    expect(j1.data.orderId).toBe("1042");
    expect(j2.data.orderId).toBe("1043");
    expect(createWooOrder).toHaveBeenCalledTimes(2);
  });

  it("falls back to non-idempotent path when key is omitted (legacy clients)", async () => {
    createWooOrder.mockResolvedValue({ orderId: "1042", totalCents: 6000 });
    createIntent.mockResolvedValue({
      providerIntentId: "pi_test",
      confirmationToken: "pi_test_secret",
      amount: 6000,
      currency: "usd",
    });

    const { POST } = await import("./route");
    const body = makeBody();
    delete (body as Record<string, unknown>).idempotencyKey;

    const r1 = await POST(mkRequest(body) as never);
    const r2 = await POST(mkRequest(body) as never);
    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
    expect(createWooOrder).toHaveBeenCalledTimes(2);
    expect(createIntent.mock.calls[0]![0].idempotencyKey).toBeUndefined();
  });

  it("rejects a malformed idempotency key with 422", async () => {
    const { POST } = await import("./route");
    const r = await POST(
      mkRequest(makeBody({ idempotencyKey: "not-a-uuid" })) as never,
    );
    expect(r.status).toBe(422);
    expect(createWooOrder).not.toHaveBeenCalled();
  });
});
