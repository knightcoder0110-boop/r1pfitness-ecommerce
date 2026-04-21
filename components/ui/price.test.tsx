import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Price } from "./price";

describe("Price", () => {
  it("renders current price only when not on sale", () => {
    render(<Price price={{ amount: 4200, currency: "USD" }} />);
    expect(screen.getByText("$42.00")).toBeInTheDocument();
    expect(screen.queryByText(/\$/)?.tagName).toBe("SPAN");
    // Only one price node.
    expect(screen.getAllByText(/\$/)).toHaveLength(1);
  });

  it("shows struck-through compare price when on sale", () => {
    render(
      <Price
        price={{ amount: 3000, currency: "USD" }}
        compareAtPrice={{ amount: 5000, currency: "USD" }}
      />,
    );
    expect(screen.getByText("$30.00")).toBeInTheDocument();
    const compare = screen.getByText("$50.00");
    expect(compare).toBeInTheDocument();
    expect(compare.className).toMatch(/line-through/);
  });

  it("ignores compare price that isn't higher than current", () => {
    render(
      <Price
        price={{ amount: 5000, currency: "USD" }}
        compareAtPrice={{ amount: 5000, currency: "USD" }}
      />,
    );
    expect(screen.getAllByText(/\$/)).toHaveLength(1);
  });
});
