import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const parseWebhook = vi.hoisted(() => vi.fn());
const markOrderProcessing = vi.hoisted(() => vi.fn());
const markOrderRefunded = vi.hoisted(() => vi.fn());
const markOrderFailed = vi.hoisted(() => vi.fn());
const markOrderCancelled = vi.hoisted(() => vi.fn());
const getWooOrder = vi.hoisted(() => vi.fn());
const emit = vi.hoisted(() => vi.fn());

vi.mock("@/lib/payments", async () => {
  const actual = await vi.importActual<typeof import("@/lib/payments")>(
    "@/lib/payments",
  );
  return {
    ...actual,
    getPaymentProvider: () => ({
      name: "stripe",
      createIntent: vi.fn(),
      retrieveIntent: vi.fn(),
      parseWebhook,
    }),
  };
});

vi.mock("@/lib/checkout/woo-order", () => ({
  getWooOrder,
  markOrderProcessing,
  markOrderRefunded,
  markOrderFailed,
  markOrderCancelled,
}));

vi.mock("@/lib/email", () => ({ emit }));

vi.mock("next/headers", () => ({
  headers: async () => new Map([["stripe-signature", "t=1,v1=abc"]]),
}));

vi.mock("@/lib/env", () => ({
  env: { NEXT_PUBLIC_SITE_URL: "https://r1pfitness.com" },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeOrder() {
  return {
    id: "1042",
    number: "1042",
    status: "pending",
    currency: "USD",
    createdAt: "2026-04-28T19:00:00Z",
    updatedAt: "2026-04-28T19:00:00Z",
    subtotal: { amount: 8000, currency: "USD" },
    discountTotal: { amount: 0, currency: "USD" },
    shippingTotal: { amount: 1000, currency: "USD" },
    taxTotal: { amount: 0, currency: "USD" },
    total: { amount: 9000, currency: "USD" },
    billing: {
      firstName: "Kai",
      lastName: "N.",
      line1: "1",
      city: "HNL",
      region: "HI",
      postalCode: "96813",
      country: "US",
      email: "kai@example.com",
    },
    shipping: {
      firstName: "Kai",
      lastName: "N.",
      line1: "1",
      city: "HNL",
      region: "HI",
      postalCode: "96813",
      country: "US",
    },
    items: [
      {
        key: "p1::v1",
        productId: "p1",
        variationId: "v1",
        name: "Tee",
        sku: "T",
        quantity: 1,
        unitPrice: { amount: 8000, currency: "USD" },
        subtotal: { amount: 8000, currency: "USD" },
      },
    ],
  };
}

function postReq(body: object = {}): Request {
  return new Request("https://example.com/api/webhooks/stripe", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  parseWebhook.mockReset();
  markOrderProcessing.mockReset().mockResolvedValue(undefined);
  markOrderRefunded.mockReset().mockResolvedValue(undefined);
  markOrderFailed.mockReset().mockResolvedValue(undefined);
  markOrderCancelled.mockReset().mockResolvedValue(undefined);
  getWooOrder.mockReset().mockResolvedValue(makeOrder());
  emit.mockReset().mockResolvedValue({ ok: true });
});

afterEach(() => vi.resetModules());

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("POST /api/webhooks/stripe — payment.failed", () => {
  it("marks the Woo order failed and emits payment.failed", async () => {
    parseWebhook.mockResolvedValue({
      type: "payment.failed",
      intentId: "pi_failed",
      orderId: "1042",
      customerEmail: "kai@example.com",
      failureCode: "card_declined",
      failureMessage: "Your card was declined.",
    });

    const { POST } = await import("./route");
    const res = await POST(postReq());

    expect(res.status).toBe(200);
    expect(markOrderFailed).toHaveBeenCalledWith(
      "1042",
      expect.stringContaining("card_declined"),
    );

    expect(emit).toHaveBeenCalledTimes(1);
    const evt = emit.mock.calls[0]?.[0];
    expect(evt.type).toBe("payment.failed");
    expect(evt.payload.failureCode).toBe("card_declined");
    expect(evt.payload.retryUrl).toBe("https://r1pfitness.com/checkout");
    // dedupe key keys on intent id
    expect(evt.payload.uniqueId).toBe("payfail-pi_failed");
  });

  it("skips Woo + emit when orderId is null (legacy intent)", async () => {
    parseWebhook.mockResolvedValue({
      type: "payment.failed",
      intentId: "pi_legacy",
      orderId: null,
      customerEmail: null,
      failureCode: "x",
      failureMessage: "y",
    });

    const { POST } = await import("./route");
    const res = await POST(postReq());

    expect(res.status).toBe(200);
    expect(markOrderFailed).not.toHaveBeenCalled();
    expect(emit).not.toHaveBeenCalled();
  });

  it("returns 200 even when emit throws (no Stripe retry storm)", async () => {
    parseWebhook.mockResolvedValue({
      type: "payment.failed",
      intentId: "pi_failed",
      orderId: "1042",
      customerEmail: "kai@example.com",
      failureCode: "card_declined",
      failureMessage: "x",
    });
    emit.mockRejectedValue(new Error("klaviyo down"));

    const { POST } = await import("./route");
    const res = await POST(postReq());

    expect(res.status).toBe(200);
    expect(markOrderFailed).toHaveBeenCalled();
  });
});

describe("POST /api/webhooks/stripe — payment.canceled", () => {
  it("marks the Woo order cancelled and emits order.cancelled with customer_request reason", async () => {
    parseWebhook.mockResolvedValue({
      type: "payment.canceled",
      intentId: "pi_cancel",
      orderId: "1042",
      cancellationReason: "abandoned",
    });

    const { POST } = await import("./route");
    const res = await POST(postReq());

    expect(res.status).toBe(200);
    expect(markOrderCancelled).toHaveBeenCalledWith(
      "1042",
      expect.stringContaining("abandoned"),
    );

    expect(emit).toHaveBeenCalledTimes(1);
    const evt = emit.mock.calls[0]?.[0];
    expect(evt.type).toBe("order.cancelled");
    expect(evt.payload.reason).toBe("customer_request");
  });

  it("buckets non-customer-driven Stripe cancel reasons under auto_timeout", async () => {
    parseWebhook.mockResolvedValue({
      type: "payment.canceled",
      intentId: "pi_cancel",
      orderId: "1042",
      cancellationReason: "fraudulent",
    });

    const { POST } = await import("./route");
    await POST(postReq());

    const evt = emit.mock.calls[0]?.[0];
    expect(evt.payload.reason).toBe("auto_timeout");
  });

  it("skips Woo + emit when orderId is null", async () => {
    parseWebhook.mockResolvedValue({
      type: "payment.canceled",
      intentId: "pi_x",
      orderId: null,
      cancellationReason: "abandoned",
    });

    const { POST } = await import("./route");
    const res = await POST(postReq());

    expect(res.status).toBe(200);
    expect(markOrderCancelled).not.toHaveBeenCalled();
    expect(emit).not.toHaveBeenCalled();
  });
});

describe("POST /api/webhooks/stripe — error mapping", () => {
  it("maps WebhookSignatureError to 400", async () => {
    const { WebhookSignatureError } = await import("@/lib/payments");
    parseWebhook.mockRejectedValue(new WebhookSignatureError("bad sig"));

    const { POST } = await import("./route");
    const res = await POST(postReq());
    expect(res.status).toBe(400);
  });

  it("maps WebhookConfigError to 500", async () => {
    const { WebhookConfigError } = await import("@/lib/payments");
    parseWebhook.mockRejectedValue(new WebhookConfigError("no secret"));

    const { POST } = await import("./route");
    const res = await POST(postReq());
    expect(res.status).toBe(500);
  });

  it("returns 200 for verified-but-unhandled events (parseWebhook returns null)", async () => {
    parseWebhook.mockResolvedValue(null);

    const { POST } = await import("./route");
    const res = await POST(postReq());
    expect(res.status).toBe(200);
    expect(markOrderProcessing).not.toHaveBeenCalled();
    expect(markOrderFailed).not.toHaveBeenCalled();
    expect(markOrderCancelled).not.toHaveBeenCalled();
  });
});
