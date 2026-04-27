import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SiteLockScreen from "./site-lock-screen";
import { useToastStore } from "@/lib/toast";

type MockNextImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  fill?: boolean;
  priority?: boolean;
};

vi.mock("next/image", () => ({
  default: function MockNextImage({
    alt,
    fill: _fill,
    priority: _priority,
    ...props
  }: MockNextImageProps) {
    return React.createElement("img", { alt: alt ?? "", ...props });
  },
}));

vi.mock("framer-motion", () => {
  const passthrough = ({ children }: { children: React.ReactNode }) => <>{children}</>;
  const motionComponent = (Tag: "div" | "form" | "h1" | "p" | "button") =>
    function MockMotionComponent({
      children,
      ...props
    }: { children?: React.ReactNode } & Record<string, unknown>) {
      const {
        animate: _animate,
        exit: _exit,
        initial: _initial,
        transition: _transition,
        variants: _variants,
        whileHover: _whileHover,
        whileTap: _whileTap,
        ...rest
      } = props;
      return React.createElement(Tag, rest, children);
    };

  return {
    AnimatePresence: passthrough,
    motion: {
      div: motionComponent("div"),
      form: motionComponent("form"),
      h1: motionComponent("h1"),
      p: motionComponent("p"),
      button: motionComponent("button"),
    },
  };
});

describe("<SiteLockScreen />", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useToastStore.setState({ message: "", visible: false, type: "success" });
  });

  it("keeps password unlock as the primary path", () => {
    render(<SiteLockScreen />);

    expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /unlock vip access/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /join the vip list/i })).toBeInTheDocument();
  });

  it("subscribes a visitor to the VIP list", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true, data: { subscribed: true } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<SiteLockScreen />);
    await user.click(screen.getByRole("button", { name: /join the vip list/i }));
    await user.type(screen.getByLabelText(/email address/i), "singhatwork55@gmail.com");
    await user.click(screen.getByRole("button", { name: /get first access/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/subscribe",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "singhatwork55@gmail.com" }),
      }),
    );
    expect(await screen.findByText(/we'll send the first-drop details/i)).toBeInTheDocument();
    expect(useToastStore.getState()).toMatchObject({
      visible: true,
      type: "success",
      message: "You're on the VIP list. Welcome to the ohana.",
    });
  });

  it("shows the API failure message when VIP signup fails", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: false,
          error: { message: "Email service unavailable. Please try again." },
        }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<SiteLockScreen />);
    await user.click(screen.getByRole("button", { name: /join the vip list/i }));
    await user.type(screen.getByLabelText(/email address/i), "ms.manish.125@gmail.com");
    await user.click(screen.getByRole("button", { name: /get first access/i }));

    expect(await screen.findByText(/email service unavailable/i)).toBeInTheDocument();
    expect(useToastStore.getState()).toMatchObject({
      visible: true,
      type: "error",
      message: "Email service unavailable. Please try again.",
    });
  });
});
