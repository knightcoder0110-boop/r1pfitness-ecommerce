"use client";

import { useEffect, useRef, useState, useCallback, useId } from "react";
import Image from "next/image";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";
import type { ProductSummary } from "@/lib/woo/types";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SearchResult {
  items: ProductSummary[];
  total: number;
}

// ── Debounce hook ─────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

// ── SearchModal ───────────────────────────────────────────────────────────────

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

export function SearchModal({ open, onClose }: SearchModalProps) {
  const dialogId = useId();
  const labelId = `${dialogId}-label`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const resultRefs = useRef<Array<HTMLAnchorElement | null>>([]);

  const debouncedQuery = useDebounce(query, 300);

  // Reset on open/close
  useEffect(() => {
    if (open) {
      setQuery("");
      setResults(null);
      setError(false);
      setActiveIndex(-1);
      // Focus input after paint
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Fetch results
  useEffect(() => {
    if (!open) return;
    const q = debouncedQuery.trim();
    if (q.length < 2) {
      setResults(null);
      setError(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(false);

    fetch(`/api/search?q=${encodeURIComponent(q)}&limit=8`)
      .then((r) => r.json())
      .then((data: SearchResult) => {
        if (!cancelled) {
          setResults(data);
          setActiveIndex(-1);
          resultRefs.current = [];
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [debouncedQuery, open]);

  // Close on Escape; trap focus within dialog
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const items = results?.items ?? [];
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = Math.min(activeIndex + 1, items.length - 1);
        setActiveIndex(next);
        resultRefs.current[next]?.focus();
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (activeIndex <= 0) {
          setActiveIndex(-1);
          inputRef.current?.focus();
        } else {
          const prev = activeIndex - 1;
          setActiveIndex(prev);
          resultRefs.current[prev]?.focus();
        }
      }
    },
    [activeIndex, onClose, results],
  );

  // Dismiss on backdrop click
  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  if (!open) return null;

  const items = results?.items ?? [];
  const hasResults = items.length > 0;
  const showEmpty = !loading && !error && debouncedQuery.trim().length >= 2 && results !== null && !hasResults;

  return (
    /* backdrop */
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center pt-[10vh] px-4 bg-[#0D0D0D]/90 backdrop-blur-md"
      onClick={handleBackdropClick}
      aria-hidden={!open}
    >
      {/* dialog — must be fully opaque; bg-surface-1 is only 4% opacity */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        className="relative w-full max-w-xl bg-[#141414] border border-[rgba(242,237,228,0.12)] shadow-[0_24px_48px_rgba(0,0,0,0.7)] flex flex-col overflow-hidden"
        onKeyDown={handleKeyDown}
      >
        {/* ── Search input ──────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          {/* Magnifier */}
          <svg
            aria-hidden
            className="size-4 shrink-0 text-muted"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <circle cx="8.5" cy="8.5" r="5.5" />
            <path d="m13.5 13.5 3.5 3.5" strokeLinecap="round" />
          </svg>

          <label id={labelId} htmlFor={`${dialogId}-input`} className="sr-only">
            Search products
          </label>
          <input
            id={`${dialogId}-input`}
            ref={inputRef}
            type="search"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            className="flex-1 bg-transparent font-mono text-sm text-text placeholder:text-faint focus:outline-none"
          />

          {/* Loading spinner */}
          {loading && (
            <svg
              aria-label="Searching…"
              className="size-4 shrink-0 animate-spin text-muted"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          )}

          {/* Dismiss shortcut hint */}
          <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border px-1.5 font-mono text-[9px] uppercase tracking-widest text-faint">
            ESC
          </kbd>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="text-muted hover:text-text transition-colors"
          >
            <svg aria-hidden viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} className="size-4">
              <path d="m4 4 12 12M16 4 4 16" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* ── Results ───────────────────────────────────────────────── */}
        <div
          role="listbox"
          aria-label="Search results"
          className="overflow-y-auto max-h-[60vh]"
        >
          {/* Empty query hint */}
          {!query && (
            <p className="px-4 py-6 font-mono text-[10px] uppercase tracking-[0.3em] text-muted text-center">
              Type to search products
            </p>
          )}

          {/* Empty results */}
          {showEmpty && (
            <p className="px-4 py-6 font-mono text-[10px] uppercase tracking-[0.3em] text-muted text-center">
              No products found for &ldquo;{debouncedQuery}&rdquo;
            </p>
          )}

          {/* Error */}
          {error && (
            <p className="px-4 py-6 font-mono text-[10px] uppercase tracking-[0.3em] text-coral text-center">
              Search unavailable — try again
            </p>
          )}

          {/* Result items */}
          {hasResults && (
            <ul role="none">
              {items.map((product, idx) => {
                const price = (product.price.amount / 100).toFixed(2);
                return (
                  <li key={product.id} role="none">
                    <Link
                      href={ROUTES.product(product.slug)}
                      role="option"
                      aria-selected={activeIndex === idx}
                      ref={(el) => { resultRefs.current[idx] = el; }}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-4 px-4 py-3 border-b border-border last:border-0",
                        "transition-colors focus:outline-none",
                        "hover:bg-surface-2 focus:bg-surface-2",
                        activeIndex === idx && "bg-surface-2",
                      )}
                    >
                      {/* Thumbnail */}
                      <div className="relative size-12 shrink-0 bg-surface-2 overflow-hidden rounded-sm">
                        {product.image ? (
                          <Image
                            src={product.image.url}
                            alt={product.image.alt || product.name}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center font-mono text-[8px] text-faint">
                            R1P
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-display tracking-wider text-sm text-text truncate">
                          {product.name}
                        </span>
                        <span className="font-mono text-[10px] text-muted">
                          {product.price.currency} {price}
                        </span>
                      </div>

                      {/* Limited badge */}
                      {product.isLimited && (
                        <span className="shrink-0 font-mono text-[9px] uppercase tracking-widest text-[#C9A84C]">
                          Limited
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          {/* "See all results" footer */}
          {hasResults && results && results.total > items.length && (
            <div className="border-t border-border px-4 py-3">
              <Link
                href={`${ROUTES.search}?q=${encodeURIComponent(debouncedQuery)}`}
                onClick={onClose}
                className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted hover:text-gold transition-colors"
              >
                See all {results.total} results for &ldquo;{debouncedQuery}&rdquo; →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
