import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CheckoutRequest } from "./types";

vi.mock("server-only", () => ({}));

const adminFetch = vi.hoisted(() => vi.fn());

vi.mock("@/lib/woo/client", () => ({ adminFetch }));

const checkoutRequest: CheckoutRequest = {
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
  coupons: ["ATHLETE10"],
};

function rawOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: 123,
    order_key: "wc_order_test_key",
    number: "123",
    status: "pending",
    currency: "USD",
    total: "55.00",
    discount_total: "5.00",
    shipping_total: "10.00",
    total_tax: "0.00",
    date_created: "2026-04-29T12:00:00",
    date_modified: "2026-04-29T12:00:00",
    billing: {
      first_name: "Kai",
      last_name: "Aloha",
      address_1: "91-000 Farrington Hwy",
      address_2: "",
      city: "Waipahu",
      state: "HI",
      postcode: "96797",
      country: "US",
      email: "kai@example.com",
    },
    shipping: {
      first_name: "Kai",
      last_name: "Aloha",
      address_1: "91-000 Farrington Hwy",
      address_2: "",
      city: "Waipahu",
      state: "HI",
      postcode: "96797",
      country: "US",
    },
    line_items: [
      {
        id: 1,
        product_id: 42,
        variation_id: 420,
        quantity: 2,
        sku: "PT-BLK-M",
        name: "Paradise Tee",
        price: "25.00",
        total: "50.00",
      },
    ],
    ...overrides,
  };
}

beforeEach(() => {
  adminFetch.mockReset();
});

describe("createWooOrder", () => {
  it("sends customer, coupon, shipping, and server-priced line items to Woo", async () => {
    adminFetch.mockResolvedValueOnce(rawOrder());
    const { createWooOrder } = await import("./woo-order");

    const result = await createWooOrder(checkoutRequest, 1000, "77");

    expect(result).toEqual({
      orderId: "123",
      orderKey: "wc_order_test_key",
      currency: "USD",
      totalCents: 5500,
    });
    expect(adminFetch).toHaveBeenCalledWith({
      path: "/orders",
      method: "POST",
      body: expect.objectContaining({
        customer_id: 77,
        status: "pending",
        set_paid: false,
        coupon_lines: [{ code: "ATHLETE10" }],
        shipping_lines: [
          {
            method_id: "flat_rate",
            method_title: "Standard Shipping",
            total: "10.00",
          },
        ],
        line_items: [
          expect.objectContaining({
            product_id: 42,
            variation_id: 420,
            quantity: 2,
            subtotal: "50.00",
            total: "50.00",
          }),
        ],
      }),
    });
  });
});


describe("getWooOrderForConfirmation", () => {
  it("returns the order only when the supplied Woo order key matches", async () => {
    adminFetch.mockResolvedValueOnce(rawOrder());
    const { getWooOrderForConfirmation } = await import("./woo-order");

    await expect(getWooOrderForConfirmation("123", "wrong-key")).resolves.toBeNull();

    adminFetch.mockResolvedValueOnce(rawOrder());
    const order = await getWooOrderForConfirmation("123", "wc_order_test_key");

    expect(order?.id).toBe("123");
    expect(order?.discountTotal.amount).toBe(500);
    expect(order?.shippingTotal.amount).toBe(1000);
  });
});

describe("markOrderCancelled", () => {
  it("transitions a pending order to cancelled with a customer note", async () => {
    // First call: getWooOrder; second: PUT
    adminFetch.mockResolvedValueOnce(rawOrder({ status: "pending" }));
    adminFetch.mockResolvedValueOnce({});

    const { markOrderCancelled } = await import("./woo-order");
    await markOrderCancelled("123", "Payment canceled: abandoned");

    const putCall = adminFetch.mock.calls[1]?.[0];
    expect(putCall.method).toBe("PUT");
    expect(putCall.path).toBe("/orders/123");
    expect(putCall.body.status).toBe("cancelled");
    expect(putCall.body.customer_note).toContain("abandoned");
  });

  it.each(["cancelled", "refunded", "processing", "completed"] as const)(
    "is a no-op when the order is already in terminal state %s",
    async (status) => {
      adminFetch.mockResolvedValueOnce(rawOrder({ status }));

      const { markOrderCancelled } = await import("./woo-order");
      await markOrderCancelled("123");

      // GET only — no PUT.
      expect(adminFetch).toHaveBeenCalledTimes(1);
    },
  );

  it("still cancels when getWooOrder returns null (cannot read status)", async () => {
    // adminFetch throws inside getWooOrder, which catches → returns null.
    // Then PUT must still fire so we do not silently leak pending orders.
    adminFetch.mockRejectedValueOnce(new Error("woo unreachable"));
    adminFetch.mockResolvedValueOnce({});

    const { markOrderCancelled } = await import("./woo-order");
    await markOrderCancelled("123");

    expect(adminFetch).toHaveBeenCalledTimes(2);
    expect(adminFetch.mock.calls[1]?.[0].body.status).toBe("cancelled");
  });
});

describe("markOrderFailed", () => {
  it("transitions a pending order to failed with a reason", async () => {
    adminFetch.mockResolvedValueOnce(rawOrder({ status: "pending" }));
    adminFetch.mockResolvedValueOnce({});

    const { markOrderFailed } = await import("./woo-order");
    await markOrderFailed("123", "Payment failed: card_declined — Card declined");

    const putCall = adminFetch.mock.calls[1]?.[0];
    expect(putCall.body.status).toBe("failed");
    expect(putCall.body.customer_note).toContain("card_declined");
  });

  it.each(["failed", "cancelled", "refunded", "processing", "completed"] as const)(
    "is a no-op when the order is already in state %s",
    async (status) => {
      adminFetch.mockResolvedValueOnce(rawOrder({ status }));

      const { markOrderFailed } = await import("./woo-order");
      await markOrderFailed("123");

      expect(adminFetch).toHaveBeenCalledTimes(1);
    },
  );
});

describe("listPendingOrdersBefore", () => {
  it("queries Woo with the right pagination + filter, returns the projection", async () => {
    adminFetch.mockResolvedValueOnce([
      rawOrder({ id: 1, number: "1", date_modified: "2026-04-30T08:00:00" }),
      rawOrder({ id: 2, number: "2", date_modified: "2026-04-30T09:00:00" }),
    ]);

    const { listPendingOrdersBefore } = await import("./woo-order");
    const out = await listPendingOrdersBefore("2026-04-30T10:00:00.000Z", 50);

    const arg = adminFetch.mock.calls[0]?.[0];
    expect(arg.path).toContain("status=pending");
    expect(arg.path).toContain("before=2026-04-30T10");
    expect(arg.path).toContain("per_page=50");
    expect(arg.path).toContain("dates_are_gmt=true");

    expect(out).toEqual([
      { id: "1", number: "1", modifiedAt: "2026-04-30T08:00:00" },
      { id: "2", number: "2", modifiedAt: "2026-04-30T09:00:00" },
    ]);
  });

  it("returns [] when Woo errors (transient unreachable)", async () => {
    adminFetch.mockRejectedValueOnce(new Error("woo down"));
    const { listPendingOrdersBefore } = await import("./woo-order");
    const out = await listPendingOrdersBefore("2026-04-30T10:00:00.000Z");
    expect(out).toEqual([]);
  });

  it("returns [] when Woo returns a non-array (defensive)", async () => {
    adminFetch.mockResolvedValueOnce({} as never);
    const { listPendingOrdersBefore } = await import("./woo-order");
    const out = await listPendingOrdersBefore("2026-04-30T10:00:00.000Z");
    expect(out).toEqual([]);
  });
});