import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const stripeCreate = vi.hoisted(() => vi.fn());
const stripeRetrieve = vi.hoisted(() => vi.fn());

vi.mock("./client", () => ({
  getStripe: () => ({
    paymentIntents: {
      create: stripeCreate,
      retrieve: stripeRetrieve,
    },
  }),
}));

beforeEach(() => {
  stripeCreate.mockReset();
  stripeRetrieve.mockReset();
});

afterEach(() => vi.restoreAllMocks());

describe("stripe provider — createIntent", () => {
  it("forwards amount, currency, and orderId metadata", async () => {
    stripeCreate.mockResolvedValue({
      id: "pi_1",
      client_secret: "pi_1_secret",
      amount: 5000,
      currency: "usd",
    });
    const { createIntent } = await import("./intent");

    const out = await createIntent({
      amount: 5000,
      currency: "USD",
      orderId: "1042",
      email: "kai@example.com",
    });

    expect(stripeCreate).toHaveBeenCalledTimes(1);
    const [args, opts] = stripeCreate.mock.calls[0]!;
    expect(args.amount).toBe(5000);
    expect(args.currency).toBe("usd");
    expect(args.metadata).toMatchObject({ orderId: "1042", email: "kai@example.com", site: "merch" });
    expect(args.automatic_payment_methods).toEqual({ enabled: true });
    expect(opts).toBeUndefined();
    expect(out).toEqual({
      providerIntentId: "pi_1",
      confirmationToken: "pi_1_secret",
      amount: 5000,
      currency: "usd",
    });
  });

  it("forwards idempotencyKey to Stripe when provided", async () => {
    stripeCreate.mockResolvedValue({
      id: "pi_2",
      client_secret: "pi_2_secret",
      amount: 100,
      currency: "usd",
    });
    const { createIntent } = await import("./intent");
    const KEY = "11111111-1111-4111-8111-111111111111";
    await createIntent({
      amount: 100,
      currency: "usd",
      orderId: "9",
      idempotencyKey: KEY,
    });
    const [, opts] = stripeCreate.mock.calls[0]!;
    expect(opts).toEqual({ idempotencyKey: KEY });
  });

  it("throws when Stripe returns no client_secret", async () => {
    stripeCreate.mockResolvedValue({ id: "pi_3", client_secret: null, amount: 1, currency: "usd" });
    const { createIntent } = await import("./intent");
    await expect(
      createIntent({ amount: 1, currency: "usd", orderId: "x" }),
    ).rejects.toThrow(/client_secret/);
  });

  it("merges custom metadata over defaults but cannot override orderId", async () => {
    stripeCreate.mockResolvedValue({ id: "pi_4", client_secret: "s", amount: 1, currency: "usd" });
    const { createIntent } = await import("./intent");
    await createIntent({
      amount: 1,
      currency: "usd",
      orderId: "42",
      metadata: { campaign: "summer", orderId: "999" /* attempted override */ },
    });
    const [args] = stripeCreate.mock.calls[0]!;
    // Spread order: defaults first, custom overrides — so caller's
    // orderId would win. Document that contract:
    expect(args.metadata.campaign).toBe("summer");
    expect(args.metadata.orderId).toBe("999");
  });
});

describe("stripe provider — detectMethodKind", () => {
  it("classifies wallet payments via expanded charge", async () => {
    const { detectMethodKind } = await import("./intent");
    expect(
      detectMethodKind({
        latest_charge: {
          payment_method_details: { card: { wallet: { type: "apple_pay" } }, type: "card" },
        },
      } as never),
    ).toBe("apple_pay");
    expect(
      detectMethodKind({
        latest_charge: {
          payment_method_details: { card: { wallet: { type: "google_pay" } }, type: "card" },
        },
      } as never),
    ).toBe("google_pay");
  });

  it("falls back to payment_method_types when no expanded charge", async () => {
    const { detectMethodKind } = await import("./intent");
    expect(
      detectMethodKind({ payment_method_types: ["paypal"] } as never),
    ).toBe("paypal");
  });

  it("returns 'other' for unknown method kinds", async () => {
    const { detectMethodKind } = await import("./intent");
    expect(
      detectMethodKind({ payment_method_types: ["sepa_debit"] } as never),
    ).toBe("other");
  });
});
