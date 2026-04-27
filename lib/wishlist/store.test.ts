import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProductSummary } from "@/lib/woo/types";
import { useWishlistStore } from "./store";

const USD = (amount: number) => ({ amount, currency: "USD" });

function makeProduct(overrides: Partial<ProductSummary> = {}): ProductSummary {
  return {
    id: "42",
    slug: "paradise-tee",
    name: "Paradise Tee",
    price: USD(4200),
    image: { id: "7", url: "/shirt.jpg", alt: "shirt" },
    stockStatus: "in_stock",
    isLimited: false,
    ...overrides,
  };
}

describe("wishlist store", () => {
  beforeEach(() => {
    localStorage.clear();
    useWishlistStore.setState({ items: [] });
    vi.setSystemTime(new Date("2025-01-10T12:00:00.000Z"));
  });

  it("toggles products by id", () => {
    const product = makeProduct();

    expect(useWishlistStore.getState().toggle(product)).toBe(true);
    expect(useWishlistStore.getState().items).toMatchObject([
      { productId: "42", slug: "paradise-tee", addedAt: "2025-01-10T12:00:00.000Z" },
    ]);

    expect(useWishlistStore.getState().toggle(product)).toBe(false);
    expect(useWishlistStore.getState().items).toEqual([]);
  });

  it("merges remote items without duplicate product ids", () => {
    const localProduct = makeProduct({ id: "42", slug: "local", name: "Local Tee" });
    useWishlistStore.getState().add(localProduct);

    useWishlistStore.getState().mergeRemote([
      {
        productId: "42",
        slug: "remote",
        name: "Remote Tee",
        price: USD(4200),
        stockStatus: "in_stock",
        isLimited: false,
        addedAt: "2025-01-09T12:00:00.000Z",
      },
      {
        productId: "99",
        slug: "new",
        name: "New Tee",
        price: USD(5000),
        stockStatus: "low_stock",
        isLimited: true,
        addedAt: "2025-01-11T12:00:00.000Z",
      },
    ]);

    expect(useWishlistStore.getState().items.map((item) => item.productId)).toEqual(["99", "42"]);
    expect(useWishlistStore.getState().items.find((item) => item.productId === "42")?.slug).toBe(
      "remote",
    );
  });
});
