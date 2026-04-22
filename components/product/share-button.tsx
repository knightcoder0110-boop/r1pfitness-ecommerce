"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * ShareButton — uses the native Web Share API when available, falls back
 * to copying the current URL to the clipboard and showing a brief inline
 * confirmation ("Copied").
 *
 * Rendered as a small square icon button with the same tap target as the
 * rest of the header icons (44px), matching the Shopify theme behaviour.
 */
export interface ShareButtonProps {
  title: string;
  text?: string;
  /** Defaults to the current `window.location.href` at click time. */
  url?: string;
  className?: string;
}

export function ShareButton({ title, text, url, className }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    const shareUrl = url ?? (typeof window !== "undefined" ? window.location.href : "");
    const payload: ShareData = { title, url: shareUrl };
    if (text) payload.text = text;

    // Native share on mobile / supported browsers.
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share(payload);
        return;
      } catch {
        // User cancelled — fall through to clipboard fallback silently.
      }
    }

    // Clipboard fallback.
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // If clipboard also fails there's nothing useful we can do — no-op.
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={copied ? "Link copied" : "Share product"}
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-sm",
        "border border-border hover:border-gold hover:text-gold",
        "text-muted transition-colors cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
        className,
      )}
    >
      {copied ? (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4 text-gold"
          aria-hidden="true"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      ) : (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4"
          aria-hidden="true"
        >
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
      )}
    </button>
  );
}
