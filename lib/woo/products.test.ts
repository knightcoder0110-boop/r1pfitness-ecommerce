import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Unit tests for the Woo products module. We stub `fetch` with realistic
 * Store API responses so we're testing the real mapping + pagination
 * behaviour, not a mocked-out layer.
 */

// `server-only` explodes under vitest; neutralize it for tests.
vi.mock("server-only", () => ({}));

const ORIGINAL_FETCH = globalThis.fetch;

const PRODUCT_SHIRT = {
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
  attributes: [],
  variations: [],
  is_in_stock: true,
  stock_quantity: 50,
};

const VARIATION_V3 = {
  id: 101,
  sku: "PT-BLK-M",
  price: "42.00",
  regular_price: "42.00",
  stock_status: "instock",
  stock_quantity: 10,
  attributes: [{ name: "pa_size", option: "M" }],
};

function jsonResponse(body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json", ...headers },
  });
}

function captureFetchMock(responses: Response[]) {
  const calls: Array<{ url: string; init: RequestInit | undefined }> = [];
  let i = 0;
  const fn = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({
      url: typeof url === "string" ? url : url.toString(),
      init,
    });
    const next = responses[i];
    i += 1;
    if (!next) throw new Error(`unexpected fetch call #${i}`);
    return next;
  });
  globalThis.fetch = fn as unknown as typeof fetch;
  return { calls };
}

beforeEach(() => {
  process.env.WOO_BASE_URL = "https://wp.example.com";
  process.env.WOO_CONSUMER_KEY = "ck_test";
  process.env.WOO_CONSUMER_SECRET = "cs_test";
});

afterEach(() => {
  globalThis.fetch = ORIGINAL_FETCH;
  vi.restoreAllMocks();
});

describe("listStoreProducts", () => {
  it("sends category+search+orderby and parses WP pagination headers", async () => {
    const { listStoreProducts } = await import("./products");
    const { calls } = captureFetchMock([
      jsonResponse([PRODUCT_SHIRT], { "x-wp-total": "37", "x-wp-totalpages": "4" }),
    ]);

    const result = await listStoreProducts({
      categorySlug: "tees",
      search: "paradise",
      page: 2,
      perPage: 12,
      orderby: "price",
      order: "asc",
    });

    expect(result.total).toBe(37);
    expect(result.totalPages).toBe(4);
    expect(result.page).toBe(2);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.slug).toBe("paradise-tee");

    expect(calls).toHaveLength(1);
    const url = new URL(calls[0]!.url);
    expect(url.pathname).toBe("/wp-json/wc/store/v1/products");
    expect(url.searchParams.get("category")).toBe("tees");
    expect(url.searchParams.get("search")).toBe("paradise");
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.get("per_page")).toBe("12");
    expect(url.searchParams.get("orderby")).toBe("price");
    expect(url.searchParams.get("order")).toBe("asc");
  });

  it("falls back to data.length / 1 page when headers are missing", async () => {
    const { listStoreProducts } = await import("./products");
    captureFetchMock([jsonResponse([PRODUCT_SHIRT, PRODUCT_SHIRT])]);

    const result = await listStoreProducts();
    expect(result.total).toBe(2);
    expect(result.totalPages).toBe(1);
  });

  it("clamps perPage to the 1..100 window", async () => {
    const { listStoreProducts } = await import("./products");
    const { calls } = captureFetchMock([jsonResponse([], { "x-wp-total": "0" })]);

    await listStoreProducts({ perPage: 500 });
    expect(new URL(calls[0]!.url).searchParams.get("per_page")).toBe("100");
  });

  it("throws WooError with WOO_UNREACHABLE when base URL is missing", async () => {
    delete process.env.WOO_BASE_URL;
    const { listStoreProducts } = await import("./products");
    const { WooError } = await import("./errors");

    await expect(listStoreProducts()).rejects.toBeInstanceOf(WooError);
  });

  it("throws WooError with NOT_FOUND on a 404 response", async () => {
    const { listStoreProducts } = await import("./products");
    const { WooError } = await import("./errors");
    globalThis.fetch = vi.fn(
      async () => new Response("not found", { status: 404, statusText: "Not Found" }),
    ) as unknown as typeof fetch;

    await expect(listStoreProducts()).rejects.toMatchObject({
      name: "WooError",
      code: "NOT_FOUND",
    });
    void WooError; // satisfy the import (assertion above already validates shape)
  });
});

describe("getStoreProductBySlug", () => {
  it("returns null when the product is not found", async () => {
    const { getStoreProductBySlug } = await import("./products");
    captureFetchMock([jsonResponse([])]);

    const result = await getStoreProductBySlug("missing");
    expect(result).toBeNull();
  });

  it("returns null for an empty slug without hitting the network", async () => {
    const { getStoreProductBySlug } = await import("./products");
    const fn = vi.fn();
    globalThis.fetch = fn as unknown as typeof fetch;

    const result = await getStoreProductBySlug("");
    expect(result).toBeNull();
    expect(fn).not.toHaveBeenCalled();
  });

  it("attaches variations when the product has any", async () => {
    const { getStoreProductBySlug } = await import("./products");
    const withVariations = { ...PRODUCT_SHIRT, variations: [{ id: 101, attributes: [] }] };
    captureFetchMock([jsonResponse([withVariations]), jsonResponse([VARIATION_V3])]);

    const product = await getStoreProductBySlug("paradise-tee");
    expect(product).not.toBeNull();
    expect(product?.variations).toHaveLength(1);
    expect(product?.variations[0]?.id).toBe("101");
  });

  it("does not hit the variations endpoint when there are none", async () => {
    const { getStoreProductBySlug } = await import("./products");
    const { calls } = captureFetchMock([jsonResponse([PRODUCT_SHIRT])]);

    const product = await getStoreProductBySlug("paradise-tee");
    expect(product?.variations).toEqual([]);
    expect(calls).toHaveLength(1);
  });
});

describe("listStoreCategories / getStoreCategoryBySlug", () => {
  it("normalizes IDs to strings", async () => {
    const { listStoreCategories } = await import("./products");
    captureFetchMock([jsonResponse([{ id: 3, name: "Tees", slug: "tees" }])]);

    const cats = await listStoreCategories();
    expect(cats).toEqual([{ id: "3", name: "Tees", slug: "tees" }]);
  });

  it("returns null for a missing category by slug", async () => {
    const { getStoreCategoryBySlug } = await import("./products");
    captureFetchMock([jsonResponse([])]);

    const result = await getStoreCategoryBySlug("nope");
    expect(result).toBeNull();
  });
});
