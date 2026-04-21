import { describe, expect, it } from "vitest";
import {
  buildShopSearch,
  DEFAULT_SORT,
  parsePage,
  parseSearch,
  parseSort,
} from "./params";

describe("parseSort", () => {
  it("returns the default for missing or invalid values", () => {
    expect(parseSort(undefined)).toBe(DEFAULT_SORT);
    expect(parseSort("")).toBe(DEFAULT_SORT);
    expect(parseSort("bogus")).toBe(DEFAULT_SORT);
  });

  it("accepts known values verbatim", () => {
    expect(parseSort("price-asc")).toBe("price-asc");
    expect(parseSort("price-desc")).toBe("price-desc");
    expect(parseSort("newest")).toBe("newest");
    expect(parseSort("featured")).toBe("featured");
  });
});

describe("parsePage", () => {
  it("coerces garbage to 1", () => {
    expect(parsePage(undefined)).toBe(1);
    expect(parsePage("")).toBe(1);
    expect(parsePage("abc")).toBe(1);
    expect(parsePage("0")).toBe(1);
    expect(parsePage("-2")).toBe(1);
  });

  it("passes through valid integers", () => {
    expect(parsePage("1")).toBe(1);
    expect(parsePage("7")).toBe(7);
    expect(parsePage("42")).toBe(42);
  });

  it("floors fractional values", () => {
    expect(parsePage("3.9")).toBe(3);
  });
});

describe("parseSearch", () => {
  it("returns empty string for missing input", () => {
    expect(parseSearch(undefined)).toBe("");
    expect(parseSearch(null)).toBe("");
    expect(parseSearch("")).toBe("");
  });

  it("collapses whitespace and trims", () => {
    expect(parseSearch("  paradise   tee  ")).toBe("paradise tee");
  });

  it("caps length at 120", () => {
    const huge = "x".repeat(500);
    expect(parseSearch(huge)).toHaveLength(120);
  });
});

describe("buildShopSearch", () => {
  it("starts from current params and applies a patch", () => {
    const current = new URLSearchParams("sort=price-asc&page=3");
    expect(buildShopSearch(current, { page: 2 })).toBe("sort=price-asc&page=2");
  });

  it("deletes keys when patch is null/undefined/empty", () => {
    const current = new URLSearchParams("sort=price-asc&q=tee");
    expect(buildShopSearch(current, { q: null })).toBe("sort=price-asc");
    expect(buildShopSearch(current, { q: "" })).toBe("sort=price-asc");
  });

  it("drops sort when it equals the default", () => {
    const current = new URLSearchParams("sort=price-asc");
    expect(buildShopSearch(current, { sort: DEFAULT_SORT })).toBe("");
  });

  it("drops page when it equals 1", () => {
    const current = new URLSearchParams("page=4");
    expect(buildShopSearch(current, { page: 1 })).toBe("");
  });

  it("accepts a plain object as `current`", () => {
    expect(buildShopSearch({ sort: "newest" }, { q: "tee" })).toBe("sort=newest&q=tee");
  });

  it("stringifies numbers", () => {
    expect(buildShopSearch({}, { page: 5 })).toBe("page=5");
  });
});
