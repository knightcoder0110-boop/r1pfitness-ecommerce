"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type State = "idle" | "loading" | "success" | "error";

interface BackInStockFormProps {
  productId: string;
  variationId?: string;
  productName: string;
}

/**
 * Inline notify-me form shown when a product / variation is out of stock.
 * Submits email + product info to /api/back-in-stock which records a
 * Klaviyo event to trigger a "Back In Stock" flow.
 */
export function BackInStockForm({
  productId,
  variationId,
  productName,
}: BackInStockFormProps) {
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === "loading" || state === "success") return;

    const email = (
      e.currentTarget.elements.namedItem("email") as HTMLInputElement
    ).value.trim();
    setState("loading");
    setErrorMsg(null);

    try {
      const res = await fetch("/api/back-in-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, productId, variationId, productName }),
      });
      const data = (await res.json()) as { success: boolean; error?: string };
      if (data.success) {
        setState("success");
      } else {
        setErrorMsg(data.error ?? "Could not save your email. Try again.");
        setState("error");
      }
    } catch {
      setErrorMsg("Network error. Please check your connection.");
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <p
        role="status"
        className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold"
      >
        ✓ You&apos;re on the list. We&apos;ll hit you when it&apos;s back.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">
        Notify me when back in stock
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <label htmlFor="bis-email" className="sr-only">
          Email address
        </label>
        <input
          id="bis-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="your@email.com"
          disabled={state === "loading"}
          className="flex-1 min-w-0 bg-bg border border-border px-3 py-2 font-mono text-sm text-text placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
        />
        <Button
          type="submit"
          size="sm"
          variant="outline"
          disabled={state === "loading"}
        >
          {state === "loading" ? "…" : "Notify"}
        </Button>
      </form>
      {state === "error" && errorMsg && (
        <p role="alert" className="font-mono text-[10px] text-coral">
          {errorMsg}
        </p>
      )}
    </div>
  );
}
