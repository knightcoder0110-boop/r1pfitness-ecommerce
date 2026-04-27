"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type State = "idle" | "loading" | "success" | "error";

interface NewsletterFormProps {
  /** Text displayed on the submit button. */
  buttonLabel?: string;
  /** Placeholder for the email input. */
  placeholder?: string;
  /** Extra class names on the wrapping form element. */
  className?: string;
  /** Max-width constraint for the input row. */
  size?: "sm" | "md" | "full";
}

const SIZE_CLASS: Record<NonNullable<NewsletterFormProps["size"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  full: "",
};

/**
 * NewsletterForm — wires the email input to POST /api/subscribe (Klaviyo).
 * Client component; keep it a leaf so it doesn't force parent server
 * components to become client components.
 */
export function NewsletterForm({
  buttonLabel = "Join",
  placeholder = "your@email.com",
  className,
  size = "sm",
}: NewsletterFormProps) {
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === "loading" || state === "success") return;

    const email = (e.currentTarget.elements.namedItem("email") as HTMLInputElement).value.trim();
    setState("loading");
    setErrorMsg(null);

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = (await res.json()) as { ok: boolean; error?: { message?: string } };

      if (data.ok) {
        setState("success");
      } else {
        setErrorMsg(data.error?.message ?? "Something went wrong. Please try again.");
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
        className={`${SIZE_CLASS[size]} mx-auto font-mono text-xs tracking-[0.25em] text-[#C9A84C] uppercase ${className ?? ""}`}
      >
        ✓ You&apos;re in. Drop alerts incoming.
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`group relative flex items-stretch gap-0 ${SIZE_CLASS[size]} ${size === "full" ? "" : "mx-auto"} ${className ?? ""} ring-border-strong focus-within:ring-gold focus-within:shadow-focus overflow-hidden rounded-md ring-1 transition-[box-shadow,ring]`}
      noValidate
    >
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <input
        id="newsletter-email"
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder={placeholder}
        disabled={state === "loading"}
        /* Override the global input styling — form wrapper owns the border now. */
        className="text-text placeholder:text-faint/90 h-14 min-w-0 flex-1 !rounded-none !border-0 bg-transparent px-5 font-mono text-sm !shadow-none !ring-0 transition-opacity focus:outline-none disabled:opacity-50"
      />
      <Button
        type="submit"
        size="lg"
        loading={state === "loading"}
        className="shrink-0 !rounded-none !px-5 sm:!px-9"
      >
        {buttonLabel}
      </Button>

      {state === "error" && errorMsg && (
        <p role="alert" className="sr-only">
          {errorMsg}
        </p>
      )}
    </form>
  );
}

// Visual error shown below the form when errorMsg is set
// (we bubble it up via a separate exported wrapper so page can show it inline)
export function NewsletterFormWithError(props: NewsletterFormProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <NewsletterForm {...props} />
    </div>
  );
}
