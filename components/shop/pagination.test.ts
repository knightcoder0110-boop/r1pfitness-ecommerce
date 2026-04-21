import { describe, expect, it } from "vitest";
import { computeWindow } from "./pagination";

describe("computeWindow", () => {
  it("shows every page when total <= 7", () => {
    expect(computeWindow(1, 1)).toEqual([1]);
    expect(computeWindow(3, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(computeWindow(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("collapses a distant middle with ellipsis", () => {
    expect(computeWindow(1, 10)).toEqual([1, 2, "ellipsis", 10]);
    expect(computeWindow(10, 10)).toEqual([1, "ellipsis", 9, 10]);
  });

  it("includes +-1 around the current page", () => {
    expect(computeWindow(5, 10)).toEqual([1, "ellipsis", 4, 5, 6, "ellipsis", 10]);
  });

  it("handles current adjacent to first/last without duplicate ellipses", () => {
    expect(computeWindow(2, 10)).toEqual([1, 2, 3, "ellipsis", 10]);
    expect(computeWindow(9, 10)).toEqual([1, "ellipsis", 8, 9, 10]);
  });
});
