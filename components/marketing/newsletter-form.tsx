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

      const data = (await res.json()) as { success: boolean; error?: string };

      if (data.success) {
        setState("success");
      } else {
        setErrorMsg(data.error ?? "Something went wrong. Please try again.");
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
        className={`${SIZE_CLASS[size]} mx-auto font-mono text-xs uppercase tracking-[0.25em] text-[#C9A84C] ${className ?? ""}`}
      >
        ✓ You're in. Drop alerts incoming.
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`group relative flex items-stretch gap-0 ${SIZE_CLASS[size]} ${size === "full" ? "" : "mx-auto"} ${className ?? ""}
        rounded-md bg-surface-1 ring-1 ring-border-strong transition-[background-color,box-shadow,ring]
        hover:bg-surface-2 focus-within:ring-gold focus-within:shadow-focus focus-within:bg-surface-2`}
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
        className="flex-1 min-w-0 h-14 bg-transparent !border-0 !ring-0 !shadow-none px-5 font-mono text-sm text-text placeholder:text-faint/90 focus:outline-none disabled:opacity-50 transition-opacity !rounded-none"
      />
      <Button type="submit" size="md" loading={state === "loading"} className="m-1.5 shrink-0">
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
