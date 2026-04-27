import { describe, expect, it, vi } from "vitest";
import type { ProductSummary } from "@/lib/woo/types";
import { wishlistItemFromProductSummary, wishlistItemToProductSummary } from "./types";

const USD = (amount: number) => ({ amount, currency: "USD" });

function makeSummary(overrides: Partial<ProductSummary> = {}): ProductSummary {
  return {
    id: "1106",
    slug: "david-tee",
    name: "A Man After God's Heart — David Tee",
    price: USD(4500),
    image: { id: "1", url: "/front.jpg", alt: "front" },
    hoverImage: { id: "2", url: "/back.jpg", alt: "back" },
    stockStatus: "in_stock",
    isLimited: true,
    colorOptions: ["Black"],
    sizeOptions: ["S", "M", "L"],
    variantCount: 3,
    updatedAt: "2026-04-27T00:00:00.000Z",
    ...overrides,
  };
}

describe("wishlist type mappers", () => {
  it("preserves variant metadata needed by product cards and quick add", () => {
    vi.setSystemTime(new Date("2026-04-27T12:00:00.000Z"));
    const summary = makeSummary();

    const item = wishlistItemFromProductSummary(summary);
    const restored = wishlistItemToProductSummary(item);

    expect(item).toMatchObject({
      hoverImage: { url: "/back.jpg" },
      colorOptions: ["Black"],
      sizeOptions: ["S", "M", "L"],
      variantCount: 3,
      updatedAt: "2026-04-27T00:00:00.000Z",
      addedAt: "2026-04-27T12:00:00.000Z",
    });

    expect(restored).toMatchObject({
      hoverImage: { url: "/back.jpg" },
      colorOptions: ["Black"],
      sizeOptions: ["S", "M", "L"],
      variantCount: 3,
      updatedAt: "2026-04-27T00:00:00.000Z",
    });
  });
});