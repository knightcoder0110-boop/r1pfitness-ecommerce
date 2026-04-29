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