import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/env", () => ({
  env: { STRIPE_WEBHOOK_SECRET: "whsec_test" },
}));

const constructEvent = vi.hoisted(() => vi.fn());

vi.mock("./client", () => ({
  getStripe: () => ({
    webhooks: { constructEvent },
  }),
}));

beforeEach(() => {
  constructEvent.mockReset();
});

afterEach(() => vi.restoreAllMocks());

const SIG = "t=123,v1=abcdef";

async function loadParse() {
  const m = await import("./webhook");
  return m.parseWebhook;
}

describe("stripe provider — parseWebhook", () => {
  it("throws WebhookConfigError when STRIPE_WEBHOOK_SECRET is unset", async () => {
    const { env } = (await import("@/lib/env")) as unknown as {
      env: { STRIPE_WEBHOOK_SECRET?: string };
    };
    const original = env.STRIPE_WEBHOOK_SECRET;
    env.STRIPE_WEBHOOK_SECRET = undefined;
    try {
      const parseWebhook = await loadParse();
      const { WebhookConfigError } = await import("../../types");
      await expect(parseWebhook(Buffer.from("{}"), SIG)).rejects.toBeInstanceOf(
        WebhookConfigError,
      );
    } finally {
      env.STRIPE_WEBHOOK_SECRET = original;
    }
  });

  it("throws WebhookSignatureError when signature header is missing", async () => {
    const parseWebhook = await loadParse();
    const { WebhookSignatureError } = await import("../../types");
    await expect(parseWebhook(Buffer.from("{}"), null)).rejects.toBeInstanceOf(
      WebhookSignatureError,
    );
  });

  it("throws WebhookSignatureError when constructEvent throws", async () => {
    constructEvent.mockImplementation(() => {
      throw new Error("bad sig");
    });
    const parseWebhook = await loadParse();
    const { WebhookSignatureError } = await import("../../types");
    await expect(
      parseWebhook(Buffer.from("{}"), SIG),
    ).rejects.toBeInstanceOf(WebhookSignatureError);
  });

  it("returns null for unhandled event types", async () => {
    constructEvent.mockReturnValue({
      type: "customer.created",
      data: { object: {} },
    });
    const parseWebhook = await loadParse();
    expect(await parseWebhook(Buffer.from("{}"), SIG)).toBeNull();
  });

  it("translates payment_intent.succeeded with email + paymentMethodKind", async () => {
    constructEvent.mockReturnValue({
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: "pi_1",
          amount: 5000,
          currency: "usd",
          metadata: { orderId: "42", email: "kai@example.com" },
          payment_method_types: ["card"],
        },
      },
    });
    const parseWebhook = await loadParse();
    const ev = await parseWebhook(Buffer.from("{}"), SIG);
    expect(ev).toEqual({
      type: "payment.succeeded",
      intentId: "pi_1",
      orderId: "42",
      amount: 5000,
      currency: "usd",
      paymentMethodKind: "card",
      customerEmail: "kai@example.com",
    });
  });

  it("falls back to receipt_email when intent metadata has no email", async () => {
    constructEvent.mockReturnValue({
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: "pi_1",
          amount: 5000,
          currency: "usd",
          receipt_email: "alt@example.com",
          metadata: { orderId: "42" },
          payment_method_types: ["card"],
        },
      },
    });
    const ev = await (await loadParse())(Buffer.from("{}"), SIG);
    expect(ev?.type === "payment.succeeded" && ev.customerEmail).toBe("alt@example.com");
  });

  it("translates payment_intent.payment_failed with code/message", async () => {
    constructEvent.mockReturnValue({
      type: "payment_intent.payment_failed",
      data: {
        object: {
          id: "pi_1",
          metadata: { orderId: "42" },
          last_payment_error: { code: "card_declined", message: "Your card was declined." },
        },
      },
    });
    const ev = await (await loadParse())(Buffer.from("{}"), SIG);
    expect(ev).toMatchObject({
      type: "payment.failed",
      intentId: "pi_1",
      orderId: "42",
      failureCode: "card_declined",
      failureMessage: "Your card was declined.",
    });
  });

  it("translates payment_intent.canceled", async () => {
    constructEvent.mockReturnValue({
      type: "payment_intent.canceled",
      data: {
        object: {
          id: "pi_2",
          metadata: { orderId: "99" },
          cancellation_reason: "abandoned",
        },
      },
    });
    const ev = await (await loadParse())(Buffer.from("{}"), SIG);
    expect(ev).toEqual({
      type: "payment.canceled",
      intentId: "pi_2",
      orderId: "99",
      cancellationReason: "abandoned",
    });
  });

  it("translates charge.refunded with chargeId, amount, reason", async () => {
    constructEvent.mockReturnValue({
      type: "charge.refunded",
      data: {
        object: {
          id: "ch_1",
          amount_refunded: 2500,
          currency: "usd",
          payment_intent: "pi_1",
          metadata: { orderId: "42" },
          refunds: { data: [{ reason: "requested_by_customer" }] },
        },
      },
    });
    const ev = await (await loadParse())(Buffer.from("{}"), SIG);
    expect(ev).toEqual({
      type: "charge.refunded",
      chargeId: "ch_1",
      intentId: "pi_1",
      orderId: "42",
      amountRefunded: 2500,
      currency: "usd",
      reason: "requested_by_customer",
    });
  });

  it("falls back to expanded payment_intent metadata for refund orderId", async () => {
    constructEvent.mockReturnValue({
      type: "charge.refunded",
      data: {
        object: {
          id: "ch_1",
          amount_refunded: 100,
          currency: "usd",
          payment_intent: { id: "pi_99", metadata: { orderId: "777" } },
          metadata: {},
          refunds: { data: [] },
        },
      },
    });
    const ev = await (await loadParse())(Buffer.from("{}"), SIG);
    expect(ev?.type === "charge.refunded" && ev.orderId).toBe("777");
    expect(ev?.type === "charge.refunded" && ev.intentId).toBe("pi_99");
  });
});
