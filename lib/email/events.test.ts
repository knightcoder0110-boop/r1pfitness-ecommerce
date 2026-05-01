import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { Order } from "@/lib/woo/types";
import {
  buildPlacedOrderEvent,
  buildRefundedOrderEvent,
  buildCancelledOrderEvent,
} from "./events";

function makeOrder(overrides: Partial<Order> = {}): Order {
  const usd = (cents: number) => ({ amount: cents, currency: "USD" });
  return {
    id: "1042",
    number: "1042",
    status: "processing",
    currency: "USD",
    createdAt: "2026-04-28T19:00:00Z",
    updatedAt: "2026-04-28T19:01:00Z",
    subtotal: usd(8000),
    discountTotal: usd(0),
    shippingTotal: usd(1000),
    taxTotal: usd(720),
    total: usd(9720),
    billing: {
      firstName: "Kai",
      lastName: "Nakoa",
      line1: "12 Aloha Way",
      city: "Honolulu",
      region: "HI",
      postalCode: "96813",
      country: "US",
      email: "kai@example.com",
      phone: "+18085551234",
    },
    shipping: {
      firstName: "Kai",
      lastName: "Nakoa",
      line1: "12 Aloha Way",
      city: "Honolulu",
      region: "HI",
      postalCode: "96813",
      country: "US",
    },
    items: [
      {
        key: "p1::v1",
        productId: "p1",
        variationId: "v1",
        name: "Tribal Tee — M",
        sku: "TT-M",
        quantity: 2,
        unitPrice: usd(4000),
        subtotal: usd(8000),
        attributes: { size: "M" },
      },
    ],
    ...overrides,
  };
}

describe("buildPlacedOrderEvent", () => {
  const baseInput = {
    siteUrl: "https://r1pfitness.com",
    orderUrl: "https://r1pfitness.com/account/orders/1042",
  };

  it("converts cents to major-unit dollars", () => {
    const e = buildPlacedOrderEvent({ order: makeOrder(), ...baseInput });
    expect(e.subtotal).toBe(80);
    expect(e.shipping).toBe(10);
    expect(e.tax).toBe(7.2);
    expect(e.total).toBe(97.2);
    expect(e.items[0]?.unitPrice).toBe(40);
    expect(e.items[0]?.rowTotal).toBe(80);
  });

  it("uses order-${id} as the dedupe unique_id", () => {
    const e = buildPlacedOrderEvent({ order: makeOrder(), ...baseInput });
    expect(e.uniqueId).toBe("order-1042");
  });

  it("populates profile from billing address", () => {
    const e = buildPlacedOrderEvent({ order: makeOrder(), ...baseInput });
    expect(e.profile).toEqual({
      email: "kai@example.com",
      firstName: "Kai",
      lastName: "Nakoa",
      phone: "+18085551234",
    });
  });

  it("allows profile override when billing email is missing", () => {
    const order = makeOrder({
      billing: { ...makeOrder().billing, email: undefined },
    });
    const e = buildPlacedOrderEvent({
      order,
      profile: { email: "fallback@example.com" },
      ...baseInput,
    });
    expect(e.profile.email).toBe("fallback@example.com");
  });

  it("throws when no email can be resolved", () => {
    const order = makeOrder({
      billing: { ...makeOrder().billing, email: undefined },
    });
    expect(() =>
      buildPlacedOrderEvent({ order, ...baseInput }),
    ).toThrow(/cannot resolve customer email/);
  });

  it("defaults paymentMethod to card", () => {
    const e = buildPlacedOrderEvent({ order: makeOrder(), ...baseInput });
    expect(e.paymentMethod).toBe("card");
  });

  it("preserves explicit paymentMethod (e.g. paypal)", () => {
    const e = buildPlacedOrderEvent({
      order: makeOrder(),
      paymentMethod: "paypal",
      ...baseInput,
    });
    expect(e.paymentMethod).toBe("paypal");
  });
});

describe("buildRefundedOrderEvent", () => {
  it("flags partial refund when amount < total", () => {
    const e = buildRefundedOrderEvent({
      order: makeOrder(),
      refundAmount: 40,
      refundKey: "ch_123",
    });
    expect(e.isPartial).toBe(true);
    expect(e.refundAmount).toBe(40);
    expect(e.uniqueId).toBe("refund-ch_123");
  });

  it("flags full refund when amount equals total", () => {
    const e = buildRefundedOrderEvent({
      order: makeOrder(),
      refundAmount: 97.2,
      refundKey: "ch_456",
    });
    expect(e.isPartial).toBe(false);
  });

  it("uses charge id in unique_id so partial refunds don't dedupe", () => {
    const a = buildRefundedOrderEvent({
      order: makeOrder(),
      refundAmount: 10,
      refundKey: "ch_a",
    });
    const b = buildRefundedOrderEvent({
      order: makeOrder(),
      refundAmount: 20,
      refundKey: "ch_b",
    });
    expect(a.uniqueId).not.toBe(b.uniqueId);
  });
});

describe("buildCancelledOrderEvent", () => {
  it("carries the cancellation reason", () => {
    const e = buildCancelledOrderEvent({
      order: makeOrder(),
      reason: "auto_timeout",
    });
    expect(e.reason).toBe("auto_timeout");
    expect(e.uniqueId).toBe("cancel-1042");
  });
});
