import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ProductPurchase } from "./product-purchase";
import { useCartStore } from "@/lib/cart";
import type { Product } from "@/lib/woo/types";

const USD = (amount: number) => ({ amount, currency: "USD" });

const PRODUCT_SIMPLE: Product = {
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
};

const PRODUCT_WITH_VARIATIONS: Product = {
  ...PRODUCT_SIMPLE,
  id: "p2",
  attributes: [
    { id: "pa_size", name: "Size", options: ["S", "M"], variation: true, visible: true },
  ],
  variations: [
    {
      id: "v-s",
      sku: "PT-S",
      price: USD(4200),
      stockStatus: "in_stock",
      attributes: { pa_size: "S" },
    },
    {
      id: "v-m",
      sku: "PT-M",
      price: USD(4200),
      stockStatus: "in_stock",
      attributes: { pa_size: "M" },
    },
  ],
};

function getPrimaryPurchaseButton(name: RegExp): HTMLButtonElement {
  return screen.getAllByRole("button", { name })[0] as HTMLButtonElement;
}

describe("<ProductPurchase />", () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    useCartStore.getState().clear();
    useCartStore.getState().close();
  });

  it("adds a simple product to the cart on click", () => {
    render(<ProductPurchase product={PRODUCT_SIMPLE} />);
    const button = getPrimaryPurchaseButton(/add to cart/i);
    expect(button).not.toBeDisabled();
    fireEvent.click(button);
    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0]!.productId).toBe("p1");
    expect(items[0]!.variationId).toBeUndefined();
  });

  it("requires variation selection before enabling add to cart", () => {
    render(<ProductPurchase product={PRODUCT_WITH_VARIATIONS} />);
    const button = getPrimaryPurchaseButton(/select options/i);
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("enables + adds the correct variation once selected", () => {
    render(<ProductPurchase product={PRODUCT_WITH_VARIATIONS} />);
    // Choose size M
    fireEvent.click(screen.getByRole("radio", { name: "M" }));
    const button = getPrimaryPurchaseButton(/add to cart/i);
    expect(button).not.toBeDisabled();
    fireEvent.click(button);

    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0]!.variationId).toBe("v-m");
    expect(items[0]!.attributes).toEqual({ pa_size: "M" });
  });

  it("disables button when product is out of stock", () => {
    render(<ProductPurchase product={{ ...PRODUCT_SIMPLE, stockStatus: "out_of_stock" }} />);
    expect(getPrimaryPurchaseButton(/sold out/i)).toBeDisabled();
  });
});
