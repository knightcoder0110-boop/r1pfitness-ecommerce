import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Unit tests for the Woo cart module.
 *
 * We mock `next/headers` so we can exercise the Cart-Token cookie lifecycle,
 * and stub `fetch` with realistic Store API shapes.
 */

vi.mock("server-only", () => ({}));

const cookieStore = new Map<string, string>();
const setCalls: Array<{ name: string; value: string; options: unknown }> = [];
const deleteCalls: string[] = [];

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => {
      const value = cookieStore.get(name);
      return value === undefined ? undefined : { name, value };
    },
    set: (name: string, value: string, options: unknown) => {
      cookieStore.set(name, value);
      setCalls.push({ name, value, options });
    },
    delete: (name: string) => {
      cookieStore.delete(name);
      deleteCalls.push(name);
    },
  }),
}));

const ORIGINAL_FETCH = globalThis.fetch;

const RAW_CART = {
  items: [
    {
      key: "abc",
      id: 42,
      quantity: 2,
      name: "Paradise Tee",
      sku: "PT-BLK-M",
      prices: {
        price: "4200",
        regular_price: "4200",
        currency_code: "USD",
        currency_minor_unit: 2,
      },
      totals: {
        line_subtotal: "8400",
        line_total: "8400",
        currency_code: "USD",
        currency_minor_unit: 2,
      },
    },
  ],
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

function cartResponse(body: unknown, token = "tok-fresh"): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "cart-token": token,
    },
  });
}

function errorResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function captureFetch(responses: Response[]) {
  const calls: Array<{ url: string; init: RequestInit | undefined }> = [];
  let i = 0;
  const fn = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: typeof url === "string" ? url : url.toString(), init });
    const next = responses[i];
    i += 1;
    if (!next) throw new Error(`unexpected fetch call #${i}`);
    return next;
  });
  globalThis.fetch = fn as unknown as typeof fetch;
  return { calls };
}

beforeEach(() => {
  cookieStore.clear();
  setCalls.length = 0;
  deleteCalls.length = 0;
  process.env.WOO_BASE_URL = "https://wp.example.com";
});

afterEach(() => {
  globalThis.fetch = ORIGINAL_FETCH;
  vi.restoreAllMocks();
});

describe("getCart", () => {
  it("sends no Cart-Token on first call, persists the returned token", async () => {
    const { getCart } = await import("./cart");
    const { calls } = captureFetch([cartResponse(RAW_CART, "tok-new")]);

    const cart = await getCart();

    expect(cart.token).toBe("tok-new");
    expect(cart.itemCount).toBe(2);

    const init = calls[0]!.init!;
    const headers = init.headers as Record<string, string>;
    expect(headers["Cart-Token"]).toBeUndefined();
    expect(setCalls).toHaveLength(1);
    expect(setCalls[0]!.value).toBe("tok-new");
    expect(setCalls[0]!.options).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  });

  it("replays a stored Cart-Token on subsequent calls", async () => {
    cookieStore.set("r1p_cart_token", "tok-existing");
    const { getCart } = await import("./cart");
    const { calls } = captureFetch([cartResponse(RAW_CART, "tok-existing")]);

    await getCart();
    const headers = calls[0]!.init!.headers as Record<string, string>;
    expect(headers["Cart-Token"]).toBe("tok-existing");
    // No cookie update — token unchanged.
    expect(setCalls).toHaveLength(0);
  });
});

describe("addCartItem", () => {
  it("POSTs to /cart/add-item with id, quantity, and variation", async () => {
    const { addCartItem } = await import("./cart");
    const { calls } = captureFetch([cartResponse(RAW_CART)]);

    await addCartItem({
      productId: "42",
      quantity: 2,
      variation: [{ attribute: "pa_size", value: "M" }],
    });

    const call = calls[0]!;
    expect(call.url).toBe("https://wp.example.com/wp-json/wc/store/v1/cart/add-item");
    expect(call.init!.method).toBe("POST");
    expect(JSON.parse(call.init!.body as string)).toEqual({
      id: 42,
      quantity: 2,
      variation: [{ attribute: "pa_size", value: "M" }],
    });
  });

  it("rejects invalid productId without hitting the network", async () => {
    const { addCartItem } = await import("./cart");
    const fn = vi.fn();
    globalThis.fetch = fn as unknown as typeof fetch;

    await expect(addCartItem({ productId: "abc", quantity: 1 })).rejects.toMatchObject({
      name: "WooError",
      code: "VALIDATION_FAILED",
    });
    expect(fn).not.toHaveBeenCalled();
  });

  it("rejects zero or negative quantity", async () => {
    const { addCartItem } = await import("./cart");
    await expect(addCartItem({ productId: 42, quantity: 0 })).rejects.toMatchObject({
      code: "INVALID_QUANTITY",
    });
  });

  it("maps Woo out_of_stock error to OUT_OF_STOCK code", async () => {
    const { addCartItem } = await import("./cart");
    captureFetch([
      errorResponse(400, {
        code: "woocommerce_rest_product_out_of_stock",
        message: "Out of stock",
      }),
    ]);

    await expect(addCartItem({ productId: 42, quantity: 1 })).rejects.toMatchObject({
      code: "OUT_OF_STOCK",
    });
  });

  it("drops cookie on invalid_token error so next request starts fresh", async () => {
    cookieStore.set("r1p_cart_token", "tok-bad");
    const { addCartItem } = await import("./cart");
    captureFetch([
      errorResponse(403, {
        code: "woocommerce_rest_cart_invalid_token",
        message: "Invalid cart token",
      }),
    ]);

    await expect(addCartItem({ productId: 42, quantity: 1 })).rejects.toMatchObject({
      code: "CART_INVALID_TOKEN",
    });
    expect(deleteCalls).toContain("r1p_cart_token");
  });
});

describe("updateCartItem / removeCartItem / coupons", () => {
  it("update POSTs to /cart/update-item with key+quantity", async () => {
    const { updateCartItem } = await import("./cart");
    const { calls } = captureFetch([cartResponse(RAW_CART)]);

    await updateCartItem({ key: "abc", quantity: 3 });

    expect(calls[0]!.url).toContain("/cart/update-item");
    expect(JSON.parse(calls[0]!.init!.body as string)).toEqual({ key: "abc", quantity: 3 });
  });

  it("remove POSTs to /cart/remove-item with key", async () => {
    const { removeCartItem } = await import("./cart");
    const { calls } = captureFetch([cartResponse(RAW_CART)]);

    await removeCartItem("abc");
    expect(calls[0]!.url).toContain("/cart/remove-item");
    expect(JSON.parse(calls[0]!.init!.body as string)).toEqual({ key: "abc" });
  });

  it("applyCoupon POSTs to /cart/apply-coupon; removeCoupon to /cart/remove-coupon", async () => {
    const { applyCoupon, removeCoupon } = await import("./cart");
    const { calls } = captureFetch([cartResponse(RAW_CART), cartResponse(RAW_CART)]);

    await applyCoupon("SUMMER26");
    await removeCoupon("SUMMER26");

    expect(calls[0]!.url).toContain("/cart/apply-coupon");
    expect(calls[1]!.url).toContain("/cart/remove-coupon");
  });

  it("rejects empty key / empty coupon code", async () => {
    const { removeCartItem, applyCoupon } = await import("./cart");
    await expect(removeCartItem("")).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
    await expect(applyCoupon("")).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
  });
});

describe("WOO_BASE_URL missing", () => {
  it("throws WOO_UNREACHABLE instead of crashing with a TypeError", async () => {
    delete process.env.WOO_BASE_URL;
    const { getCart } = await import("./cart");
    await expect(getCart()).rejects.toMatchObject({ code: "WOO_UNREACHABLE" });
  });
});
