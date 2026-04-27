import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CheckoutSuccessSync } from "./checkout-success-sync";
import { useCartStore } from "@/lib/cart";
import type { Product } from "@/lib/woo/types";

const clearCartSpy = vi.fn(async () => ({ ok: true, data: null }));

vi.mock("@/lib/cart/bff", () => ({
  bffClearCart: () => clearCartSpy(),
}));

const PRODUCT: Product = {
  id: "p1",
  slug: "paradise-tee",
  name: "Paradise Tee",
  description: "",
  shortDescription: "",
  price: { amount: 4200, currency: "USD" },
  images: [{ id: "img-1", url: "/tee.jpg", alt: "tee" }],
  categories: [],
  tags: [],
  attributes: [],
  variations: [],
  stockStatus: "in_stock",
  meta: {},
  seo: {},
};

describe("CheckoutSuccessSync", () => {
  beforeEach(() => {
    clearCartSpy.mockClear();
    localStorage.clear();
    sessionStorage.clear();
    useCartStore.setState({
      ...useCartStore.getInitialState(),
      items: [],
      currency: "USD",
      coupon: null,
      isOpen: false,
    });
  });

  it("clears the local cart and requests a server-side cart clear on mount", async () => {
    useCartStore.getState().addItem({ product: PRODUCT, quantity: 1 });

    render(<CheckoutSuccessSync orderId="1125" />);

    await waitFor(() => {
      expect(useCartStore.getState().items).toHaveLength(0);
      expect(clearCartSpy).toHaveBeenCalledTimes(1);
    });
  });

  it("dedupes the server-side clear for the same order id across remounts", async () => {
    const first = render(<CheckoutSuccessSync orderId="1125" />);

    await waitFor(() => {
      expect(clearCartSpy).toHaveBeenCalledTimes(1);
    });

    first.unmount();
    render(<CheckoutSuccessSync orderId="1125" />);

    await waitFor(() => {
      expect(clearCartSpy).toHaveBeenCalledTimes(1);
    });
  });
});