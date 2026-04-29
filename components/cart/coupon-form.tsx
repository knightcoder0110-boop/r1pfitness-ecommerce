"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { useServerCart } from "@/lib/cart/sync";
import { useCartCoupon } from "@/lib/cart";
import type { Money } from "@/lib/woo/types";

/** Format a Money value as a display string, e.g. "$12.00". */
function fmt(m: Money): string {
  return (m.amount / 100).toLocaleString("en-US", {
    style: "currency",
    currency: m.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

/**
 * Coupon code input for the cart drawer.
 *
 * When a coupon is active, shows the code + discount with a remove button.
 * When inactive, shows a compact text input + Apply button.
 * Always calls the BFF — degrades silently when backend is offline.
 */
export function CouponForm() {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "removing">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const { applyCoupon, removeCoupon } = useServerCart();
  const coupon = useCartCoupon();

  // ── Applied state ────────────────────────────────────────────────
  if (coupon) {
    return (
      <div className="flex items-center justify-between border border-accent/30 bg-accent/5 px-3 py-2 rounded-sm">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted flex-shrink-0">
            Coupon
          </span>
          <span className="font-mono text-xs text-accent uppercase truncate">
            {coupon.code}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <span className="font-mono text-xs text-green-500 whitespace-nowrap">
            −{fmt(coupon.discount)}
          </span>
          <button
            type="button"
            disabled={status === "removing"}
            onClick={async () => {
              setStatus("removing");
              await removeCoupon(coupon.code);
              setStatus("idle");
            }}
            aria-label={`Remove coupon ${coupon.code}`}
            className="cursor-pointer p-0.5 text-muted hover:text-text transition-colors disabled:opacity-40 disabled:cursor-wait"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // ── Input state ──────────────────────────────────────────────────
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const trimmed = code.trim().toUpperCase();
        if (!trimmed) return;
        setStatus("loading");
        setErrorMsg("");
        const result = await applyCoupon(trimmed);
        if (result?.ok) {
          setStatus("idle");
          setCode("");
        } else {
          setStatus("error");
          setErrorMsg(result?.error.message ?? "Invalid coupon code");
        }
      }}
      className="space-y-1"
    >
      <div className="flex gap-2">
        <label htmlFor="coupon-code-input" className="sr-only">
          Coupon code
        </label>
        <input
          id="coupon-code-input"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            if (status === "error") setStatus("idle");
          }}
          placeholder="COUPON CODE"
          maxLength={64}
          autoComplete="off"
          spellCheck={false}
          disabled={status === "loading"}
          className={cn(
            "flex-1 bg-bg border px-3 py-2 font-mono text-xs uppercase tracking-[0.15em] text-text placeholder:text-faint focus:outline-none focus:ring-1 focus:ring-accent transition-colors",
            status === "error" ? "border-red-500/60" : "border-border",
          )}
        />
        <Button
          type="submit"
          size="sm"
          disabled={status === "loading" || !code.trim()}
          className="flex-shrink-0"
        >
          {status === "loading" ? "…" : "Apply"}
        </Button>
      </div>
      {status === "error" && errorMsg && (
        <p role="alert" className="font-mono text-[10px] text-red-500 pl-0.5">
          {errorMsg}
        </p>
      )}
    </form>
  );
}
