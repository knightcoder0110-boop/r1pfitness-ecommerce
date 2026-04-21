import { describe, expect, it } from "vitest";
import type { Product, ProductVariation } from "@/lib/woo/types";
import {
  EMPTY_CART,
  addItem,
  buildLineItem,
  clearCart,
  computeTotals,
  lineKey,
  removeItem,
  setQuantity,
} from "./reducer";

const USD = (amount: number) => ({ amount, currency: "USD" });

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "p1",
    slug: "paradise-tee",
    name: "Paradise Tee",
    description: "",
    shortDescription: "",
    price: USD(4200),
    images: [{ id: "i1", url: "/a.jpg", alt: "a" }],
    categories: [],
    tags: [],
    attributes: [],
    variations: [],
    stockStatus: "in_stock",
    meta: {},
    seo: {},
    ...overrides,
  };
}

function makeVariation(overrides: Partial<ProductVariation> = {}): ProductVariation {
  return {
    id: "v1",
    sku: "PT-M",
    price: USD(4200),
    stockStatus: "in_stock",
    attributes: { pa_size: "M" },
    ...overrides,
  };
}

describe("cart/reducer", () => {
  describe("lineKey", () => {
    it("combines product + variation id", () => {
      expect(lineKey("p1", "v1")).toBe("p1::v1");
    });
    it("uses product id alone when no variation", () => {
      expect(lineKey("p1")).toBe("p1");
    });
  });

  describe("buildLineItem", () => {
    it("uses variation price + image when present", () => {
      const product = makeProduct();
      const variation = makeVariation({
        price: USD(5000),
        image: { id: "vi", url: "/v.jpg", alt: "v" },
      });
      const item = buildLineItem({ product, variation, quantity: 2 });
      expect(item.unitPrice.amount).toBe(5000);
      expect(item.subtotal.amount).toBe(10_000);
      expect(item.image?.url).toBe("/v.jpg");
      expect(item.variationId).toBe("v1");
      expect(item.attributes).toEqual({ pa_size: "M" });
    });

    it("falls back to product price + first image when no variation", () => {
      const item = buildLineItem({ product: makeProduct(), quantity: 1 });
      expect(item.unitPrice.amount).toBe(4200);
      expect(item.image?.url).toBe("/a.jpg");
      expect(item.variationId).toBeUndefined();
    });
  });

  describe("addItem", () => {
    it("adds a new line to an empty cart", () => {
      const next = addItem(EMPTY_CART, { product: makeProduct() });
      expect(next.items).toHaveLength(1);
      expect(next.items[0]!.quantity).toBe(1);
      expect(next.currency).toBe("USD");
    });

    it("merges quantity when the same product+variation is added twice", () => {
      let cart = addItem(EMPTY_CART, {
        product: makeProduct(),
        variation: makeVariation(),
        quantity: 2,
      });
      cart = addItem(cart, {
        product: makeProduct(),
        variation: makeVariation(),
        quantity: 3,
      });
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0]!.quantity).toBe(5);
      expect(cart.items[0]!.subtotal.amount).toBe(21_000);
    });

    it("keeps variations separate as distinct lines", () => {
      let cart = addItem(EMPTY_CART, {
        product: makeProduct(),
        variation: makeVariation({ id: "v1", attributes: { pa_size: "M" } }),
      });
      cart = addItem(cart, {
        product: makeProduct(),
        variation: makeVariation({ id: "v2", sku: "PT-L", attributes: { pa_size: "L" } }),
      });
      expect(cart.items).toHaveLength(2);
    });

    it("rejects currency mismatch", () => {
      const cart = addItem(EMPTY_CART, { product: makeProduct() });
      const next = addItem(cart, {
        product: makeProduct({ id: "p2", price: { amount: 1000, currency: "EUR" } }),
      });
      expect(next).toEqual(cart);
    });

    it("ignores non-positive quantities", () => {
      expect(addItem(EMPTY_CART, { product: makeProduct(), quantity: 0 }).items).toHaveLength(0);
      expect(addItem(EMPTY_CART, { product: makeProduct(), quantity: -1 }).items).toHaveLength(0);
    });
  });

  describe("setQuantity", () => {
    it("updates qty and recomputes subtotal", () => {
      const cart = addItem(EMPTY_CART, { product: makeProduct(), quantity: 1 });
      const key = cart.items[0]!.key;
      const next = setQuantity(cart, key, 3);
      expect(next.items[0]!.quantity).toBe(3);
      expect(next.items[0]!.subtotal.amount).toBe(12_600);
    });

    it("removes the line when qty <= 0", () => {
      const cart = addItem(EMPTY_CART, { product: makeProduct() });
      const key = cart.items[0]!.key;
      expect(setQuantity(cart, key, 0).items).toHaveLength(0);
    });

    it("is a no-op for unknown keys", () => {
      const cart = addItem(EMPTY_CART, { product: makeProduct() });
      expect(setQuantity(cart, "nope", 5)).toEqual(cart);
    });
  });

  describe("removeItem", () => {
    it("removes matching line only", () => {
      let cart = addItem(EMPTY_CART, {
        product: makeProduct(),
        variation: makeVariation({ id: "v1" }),
      });
      cart = addItem(cart, {
        product: makeProduct(),
        variation: makeVariation({ id: "v2", sku: "PT-L" }),
      });
      const next = removeItem(cart, cart.items[0]!.key);
      expect(next.items).toHaveLength(1);
      expect(next.items[0]!.variationId).toBe("v2");
    });
  });

  describe("clearCart", () => {
    it("empties items but keeps currency", () => {
      const cart = addItem(EMPTY_CART, { product: makeProduct() });
      const cleared = clearCart(cart);
      expect(cleared.items).toHaveLength(0);
      expect(cleared.currency).toBe("USD");
    });
  });

  describe("computeTotals", () => {
    it("sums quantities and subtotals", () => {
      let cart = addItem(EMPTY_CART, {
        product: makeProduct(),
        variation: makeVariation({ id: "v1" }),
        quantity: 2,
      });
      cart = addItem(cart, {
        product: makeProduct({ id: "p2", price: USD(1000) }),
        quantity: 3,
      });
      const totals = computeTotals(cart);
      expect(totals.itemCount).toBe(5);
      expect(totals.subtotal.amount).toBe(4200 * 2 + 1000 * 3);
    });

    it("is zero for an empty cart", () => {
      const totals = computeTotals(EMPTY_CART);
      expect(totals).toEqual({ itemCount: 0, subtotal: { amount: 0, currency: "USD" } });
    });
  });
});
