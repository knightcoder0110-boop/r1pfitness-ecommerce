import { describe, it, expect } from "vitest";
import {
  mapCart,
  mapCartItem,
  mapProduct,
  mapProductSummary,
  mapVariation,
  toMinorUnits,
  type RawStoreCart,
  type RawStoreCartItem,
  type RawStoreProduct,
  type RawStoreVariation,
} from "./mappers";

describe("toMinorUnits", () => {
  it.each([
    ["4200", 4200],
    [4200, 4200],
    ["", 0],
    [null, 0],
    [undefined, 0],
    ["abc", 0],
    [" 100 ", 100],
    [99.6, 100],
  ])("parses %p → %i", (input, expected) => {
    expect(toMinorUnits(input as never)).toBe(expected);
  });
});

const baseProduct: RawStoreProduct = {
  id: 42,
  name: "Paradise Tee",
  slug: "paradise-tee",
  description: "<p>Fire tee.</p>",
  short_description: "Fire tee.",
  prices: {
    price: "4200",
    regular_price: "4200",
    currency_code: "USD",
    currency_minor_unit: 2,
  },
  images: [{ id: 7, src: "https://cdn/x.jpg", alt: "front" }],
  categories: [{ id: 3, name: "Tees", slug: "tees" }],
  tags: [{ id: 9, name: "hawaii", slug: "hawaii" }],
  attributes: [
    {
      name: "Size",
      taxonomy: "pa_size",
      has_variations: true,
      terms: [
        { name: "S", slug: "s" },
        { name: "M", slug: "m" },
      ],
    },
  ],
  is_in_stock: true,
  stock_quantity: 50,
  meta_data: [
    { key: "fit_type", value: "Relaxed" },
    { key: "is_limited", value: true },
    { key: "drop_date", value: "2026-05-01T00:00:00Z" },
  ],
};

describe("mapProduct", () => {
  it("normalizes core fields and IDs to strings", () => {
    const p = mapProduct(baseProduct);
    expect(p.id).toBe("42");
    expect(p.slug).toBe("paradise-tee");
    expect(p.name).toBe("Paradise Tee");
    expect(p.price).toEqual({ amount: 4200, currency: "USD" });
    expect(p.compareAtPrice).toBeUndefined();
    expect(p.images).toHaveLength(1);
    expect(p.images[0]?.id).toBe("7");
    expect(p.categories[0]?.slug).toBe("tees");
    expect(p.tags).toEqual(["hawaii"]);
    expect(p.stockStatus).toBe("in_stock");
    expect(p.stockQuantity).toBe(50);
  });

  it("sets compareAtPrice only when sale_price differs", () => {
    const onSale = mapProduct({
      ...baseProduct,
      prices: { ...baseProduct.prices, price: "3000", sale_price: "3000", regular_price: "4200" },
    });
    expect(onSale.compareAtPrice).toEqual({ amount: 4200, currency: "USD" });

    const notSale = mapProduct({
      ...baseProduct,
      prices: { ...baseProduct.prices, price: "4200", sale_price: "4200" },
    });
    expect(notSale.compareAtPrice).toBeUndefined();
  });

  it("derives low_stock from stock_quantity ≤ 3", () => {
    const p = mapProduct({ ...baseProduct, stock_quantity: 2 });
    expect(p.stockStatus).toBe("low_stock");
  });

  it("derives out_of_stock from is_in_stock=false", () => {
    const p = mapProduct({ ...baseProduct, is_in_stock: false });
    expect(p.stockStatus).toBe("out_of_stock");
  });

  it("unpacks meta_data into typed ProductMeta", () => {
    const p = mapProduct(baseProduct);
    expect(p.meta.fitType).toBe("Relaxed");
    expect(p.meta.isLimited).toBe(true);
    expect(p.meta.dropDate).toBe("2026-05-01T00:00:00Z");
  });

  it("tolerates missing optional sections", () => {
    const lean: RawStoreProduct = {
      id: 1,
      name: "X",
      slug: "x",
      prices: { price: "0", regular_price: "0", currency_code: "USD", currency_minor_unit: 2 },
    };
    const p = mapProduct(lean);
    expect(p.images).toEqual([]);
    expect(p.categories).toEqual([]);
    expect(p.tags).toEqual([]);
    expect(p.attributes).toEqual([]);
    expect(p.meta).toEqual({});
  });
});

describe("mapProductSummary", () => {
  it("produces a lean shape for listings", () => {
    const s = mapProductSummary(baseProduct);
    expect(s).toMatchObject({
      id: "42",
      slug: "paradise-tee",
      name: "Paradise Tee",
      price: { amount: 4200, currency: "USD" },
      stockStatus: "in_stock",
      isLimited: true,
    });
    expect(s.image?.url).toBe("https://cdn/x.jpg");
    // Summary must NOT carry the heavy fields.
    expect((s as unknown as { description?: string }).description).toBeUndefined();
  });
});

describe("mapVariation", () => {
  it("collects attributes into a record and flags stock", () => {
    const raw: RawStoreVariation = {
      id: 101,
      sku: "PT-BLK-M",
      prices: { price: "4200", regular_price: "4200", currency_code: "USD", currency_minor_unit: 2 },
      attributes: [
        { name: "pa_size", value: "M" },
        { name: "pa_color", value: "Black" },
      ],
      is_in_stock: true,
      stock_quantity: 10,
    };
    const v = mapVariation(raw);
    expect(v.id).toBe("101");
    expect(v.sku).toBe("PT-BLK-M");
    expect(v.attributes).toEqual({ pa_size: "M", pa_color: "Black" });
    expect(v.stockStatus).toBe("in_stock");
    expect(v.stockQuantity).toBe(10);
  });
});

describe("mapCart / mapCartItem", () => {
  const rawItem: RawStoreCartItem = {
    key: "abc123",
    id: 42,
    quantity: 2,
    name: "Paradise Tee",
    sku: "PT-BLK-M",
    prices: { price: "4200", regular_price: "4200", currency_code: "USD", currency_minor_unit: 2 },
    totals: {
      line_subtotal: "8400",
      line_total: "8400",
      currency_code: "USD",
      currency_minor_unit: 2,
    },
    variation: [{ attribute: "pa_size", value: "M" }],
  };

  it("maps one line item", () => {
    const li = mapCartItem(rawItem);
    expect(li.key).toBe("abc123");
    expect(li.productId).toBe("42");
    expect(li.quantity).toBe(2);
    expect(li.unitPrice).toEqual({ amount: 4200, currency: "USD" });
    expect(li.subtotal).toEqual({ amount: 8400, currency: "USD" });
    expect(li.attributes).toEqual({ pa_size: "M" });
  });

  it("maps a whole cart and forwards the token", () => {
    const raw: RawStoreCart = {
      items: [rawItem],
      items_count: 2,
      totals: {
        total_items: "8400",
        total_price: "8400",
        total_discount: "0",
        total_shipping: "0",
        total_tax: "0",
        currency_code: "USD",
        currency_minor_unit: 2,
      },
    };
    const cart = mapCart(raw, "tok-42");
    expect(cart.token).toBe("tok-42");
    expect(cart.itemCount).toBe(2);
    expect(cart.items).toHaveLength(1);
    expect(cart.total).toEqual({ amount: 8400, currency: "USD" });
    expect(cart.coupons).toEqual([]);
  });
});
