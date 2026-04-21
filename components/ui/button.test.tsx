import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./button";

describe("Button", () => {
  it("renders its children as the accessible label", () => {
    render(<Button>Add to cart</Button>);
    expect(screen.getByRole("button", { name: /add to cart/i })).toBeInTheDocument();
  });

  it("defaults to type=button to avoid accidental form submission", () => {
    render(<Button>Safe</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("invokes onClick when pressed", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Press</Button>);
    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled and aria-busy while loading, and does not fire onClick", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Saving
      </Button>,
    );
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute("aria-busy", "true");
    await user.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("respects the disabled prop", () => {
    render(<Button disabled>Nope</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("merges custom className after variant classes", () => {
    render(<Button className="custom-xyz">Styled</Button>);
    expect(screen.getByRole("button")).toHaveClass("custom-xyz");
  });

  it("forwards refs to the underlying button element", () => {
    const ref = { current: null } as React.RefObject<HTMLButtonElement | null>;
    render(<Button ref={ref}>Ref</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});
