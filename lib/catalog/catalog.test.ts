import { beforeEach, describe, expect, it } from "vitest";
import { __resetCatalogForTests, getCatalog } from "./source";

beforeEach(() => {
  __resetCatalogForTests();
});

describe("catalog (fixture adapter)", () => {
  it("lists all products on an empty query", async () => {
    const { items, total } = await getCatalog().listProducts({});
    expect(items.length).toBeGreaterThan(0);
    expect(total).toBe(items.length);
    // Summary shape — no description field.
    expect((items[0] as unknown as { description?: string }).description).toBeUndefined();
  });

  it("filters by category slug", async () => {
    const { items } = await getCatalog().listProducts({ category: "tees" });
    expect(items.length).toBeGreaterThan(0);
    for (const s of items) {
      // Summary doesn't carry categories; verify via slug naming instead.
      expect(s.slug).toMatch(/tee/);
    }
  });

  it("filters by search term against name + tags", async () => {
    const { items } = await getCatalog().listProducts({ search: "hoodie" });
    expect(items.length).toBeGreaterThan(0);
    for (const s of items) expect(s.name.toLowerCase()).toContain("hoodie");
  });

  it("sorts by price ascending", async () => {
    const { items } = await getCatalog().listProducts({ sort: "price-asc" });
    const amounts = items.map((p) => p.price.amount);
    expect(amounts).toEqual([...amounts].sort((a, b) => a - b));
  });

  it("paginates", async () => {
    const first = await getCatalog().listProducts({ page: 1, pageSize: 2 });
    expect(first.items).toHaveLength(2);
    expect(first.pageCount).toBeGreaterThanOrEqual(2);

    const second = await getCatalog().listProducts({ page: 2, pageSize: 2 });
    expect(second.items[0]?.id).not.toBe(first.items[0]?.id);
  });

  it("clamps out-of-range pages to the last page", async () => {
    const huge = await getCatalog().listProducts({ page: 9999, pageSize: 2 });
    expect(huge.items.length).toBeGreaterThan(0);
    expect(huge.page).toBe(huge.pageCount);
  });

  it("returns a product by slug or null", async () => {
    const found = await getCatalog().getProductBySlug("paradise-tee");
    expect(found?.slug).toBe("paradise-tee");

    const missing = await getCatalog().getProductBySlug("does-not-exist");
    expect(missing).toBeNull();
  });

  it("lists + resolves categories", async () => {
    const all = await getCatalog().listCategories();
    expect(all.length).toBeGreaterThan(0);
    const one = await getCatalog().getCategoryBySlug(all[0]!.slug);
    expect(one?.slug).toBe(all[0]!.slug);
  });
});
