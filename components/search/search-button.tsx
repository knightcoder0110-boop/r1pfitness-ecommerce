"use client";

import { useEffect, useState } from "react";
import { SearchModal } from "./search-modal";

/**
 * SearchButton — magnifier icon in the site header.
 *
 * Owns the open/close state for the <SearchModal> so the server-rendered
 * <SiteHeader> stays a server component with this as a client leaf.
 *
 * Global keyboard shortcut: Cmd+K (Mac) / Ctrl+K (Windows/Linux).
 */
export function SearchButton() {
  const [open, setOpen] = useState(false);

  // Global Cmd/Ctrl+K shortcut
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search products (⌘K)"
        className="inline-flex h-10 w-10 items-center justify-center text-text hover:text-gold cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
      >
        <svg
          aria-hidden
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          style={{ width: "var(--icon-size)", height: "var(--icon-size)" }}
        >
          <circle cx="8.5" cy="8.5" r="5.5" />
          <path d="m13.5 13.5 3.5 3.5" strokeLinecap="round" />
        </svg>
      </button>

      <SearchModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
