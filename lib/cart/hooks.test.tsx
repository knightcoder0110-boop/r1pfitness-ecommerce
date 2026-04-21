import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Product, ProductVariation } from "@/lib/woo/types";
import {
  useCartActions,
  useCartIsOpen,
  useCartItemCount,
  useCartItems,
  useCartSubtotal,
  useCartStore,
} from "./index";

const USD = (amount: number) => ({ amount, currency: "USD" });

const PRODUCT: Product = {
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

const VARIATION: ProductVariation = {
  id: "v1",
  sku: "PT-M",
  price: USD(4200),
  stockStatus: "in_stock",
  attributes: { pa_size: "M" },
};

describe("cart hooks + store", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    act(() => {
      useCartStore.getState().clear();
      useCartStore.getState().close();
    });
  });

  it("addItem pushes an item, opens the drawer, and updates count + subtotal", () => {
    const { result: actions } = renderHook(() => useCartActions());
    const { result: items } = renderHook(() => useCartItems());
    const { result: count } = renderHook(() => useCartItemCount());
    const { result: subtotal } = renderHook(() => useCartSubtotal());
    const { result: isOpen } = renderHook(() => useCartIsOpen());

    act(() => {
      actions.current.addItem({ product: PRODUCT, variation: VARIATION, quantity: 2 });
    });

    expect(items.current).toHaveLength(1);
    expect(count.current).toBe(2);
    expect(subtotal.current.amount).toBe(8400);
    expect(isOpen.current).toBe(true);
  });

  it("setQuantity updates line and subtotal", () => {
    const { result: actions } = renderHook(() => useCartActions());
    const { result: subtotal } = renderHook(() => useCartSubtotal());

    act(() => {
      actions.current.addItem({ product: PRODUCT, variation: VARIATION, quantity: 1 });
    });
    const key = useCartStore.getState().items[0]!.key;

    act(() => actions.current.setQuantity(key, 4));

    expect(subtotal.current.amount).toBe(16_800);
    expect(useCartStore.getState().items[0]!.quantity).toBe(4);
  });

  it("removeItem empties the cart", () => {
    const { result: actions } = renderHook(() => useCartActions());

    act(() => actions.current.addItem({ product: PRODUCT }));
    const key = useCartStore.getState().items[0]!.key;
    act(() => actions.current.removeItem(key));

    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("open/close/toggle control drawer visibility without touching items", () => {
    const { result } = renderHook(() => useCartActions());
    const { result: isOpen } = renderHook(() => useCartIsOpen());

    act(() => result.current.open());
    expect(isOpen.current).toBe(true);
    act(() => result.current.close());
    expect(isOpen.current).toBe(false);
    act(() => result.current.toggle());
    expect(isOpen.current).toBe(true);
  });
});
