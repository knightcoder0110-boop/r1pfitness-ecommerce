"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { parseSearch, buildShopSearch } from "@/lib/shop";
import { cn } from "@/lib/utils/cn";

interface SearchInputProps {
  /** Additional className for the wrapper element. */
  className?: string;
  /** Placeholder text shown inside the input. */
  placeholder?: string;
}

/**
 * Full-page search input.
 *
 * Differences from the compact SearchBar used in /shop:
 * - Auto-focuses on mount (one-shot, not on every render).
 * - Debounces URL updates (400 ms) so results stream in as you type.
 * - Shows a live character-count hint when the query is 1 char (needs ≥ 2).
 * - Shows a prominent × clear button.
 * - Keyboard: Escape clears the input (does NOT close a modal — this is a page).
 */
export function SearchInput({ className, placeholder = "Search the drop…" }: SearchInputProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const urlQ = params.get("q") ?? "";
  const [value, setValue] = useState(urlQ);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didFocusRef = useRef(false);

  // Autofocus once on mount — requestAnimationFrame keeps layout stable.
  useEffect(() => {
    if (!didFocusRef.current) {
      didFocusRef.current = true;
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, []);

  // Sync with URL when the user navigates (back/forward).
  useEffect(() => {
    setValue(urlQ);
  }, [urlQ]);

  // Commit a query to the URL, resetting page to 1.
  function commit(raw: string) {
    const q = parseSearch(raw);
    const next = buildShopSearch(params, { q: q || null, page: null });
    router.replace(`${pathname}${next ? `?${next}` : ""}`, { scroll: false });
  }

  // Debounced onChange — updates URL 400 ms after the user stops typing.
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    setValue(raw);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => commit(raw), 400);
  }

  function handleClear() {
    setValue("");
    commit("");
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      handleClear();
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (debounceRef.current) clearTimeout(debounceRef.current);
      commit(value);
    }
  }

  // Cleanup debounce on unmount.
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const showHint = value.trim().length === 1;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="relative flex items-center">
        {/* Magnifier */}
        <svg
          aria-hidden
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="pointer-events-none absolute left-0 size-5 text-muted"
        >
          <circle cx="8.5" cy="8.5" r="5.75" />
          <path d="m13.5 13.5 4 4" />
        </svg>

        <input
          ref={inputRef}
          type="search"
          role="searchbox"
          aria-label="Search products"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            // layout
            "w-full pl-8 pr-10 pb-3 pt-1",
            // typography
            "font-display text-3xl sm:text-4xl md:text-5xl tracking-widest uppercase",
            // colours — transparent background, gold bottom border
            "bg-transparent text-text placeholder:text-border",
            "border-b-2 border-b-border focus:border-b-[#C9A84C]",
            // no browser default outline / search decorations
            "outline-none ring-0 transition-colors duration-200",
            "[&::-webkit-search-decoration]:hidden",
            "[&::-webkit-search-cancel-button]:hidden",
          )}
        />

        {/* Clear button — only shown when there is content */}
        {value && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="absolute right-0 flex items-center justify-center size-8 text-muted hover:text-text transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C] rounded-sm"
          >
            <svg aria-hidden viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} className="size-4">
              <path d="m3 3 10 10M13 3 3 13" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {/* 1-character hint */}
      {showHint && (
        <p
          role="status"
          aria-live="polite"
          className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted"
        >
          Keep typing — need at least 2 characters
        </p>
      )}
    </div>
  );
}
