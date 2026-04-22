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
      className="fixed inset-0 z-60 flex items-start justify-center pt-[8vh] px-4 bg-bg/92 backdrop-blur-md"
      onClick={handleBackdropClick}
      aria-hidden={!open}
    >
      {/* dialog — fully opaque, elevated, wider + taller for readability */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        className="relative w-full max-w-2xl bg-[#141414] border border-[rgba(242,237,228,0.15)] rounded-sm shadow-[0_32px_64px_rgba(0,0,0,0.75)] flex flex-col overflow-hidden"
        onKeyDown={handleKeyDown}
      >
        {/* ── Search input ──────────────────────────────────────────── */}
        <div className="flex items-center gap-4 px-6 h-16 border-b border-border-strong">
          {/* Magnifier — bold, gold */}
          <svg
            aria-hidden
            className="size-5 shrink-0 text-gold"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
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
            placeholder="Search products, collections, drops…"
            className="flex-1 bg-transparent font-serif text-lg text-text placeholder:text-muted focus:outline-none"
          />

          {/* Loading spinner */}
          {loading && (
            <svg
              aria-label="Searching…"
              className="size-5 shrink-0 animate-spin text-gold"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          )}

          {/* Dismiss shortcut hint */}
          <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded-sm border border-border-strong px-2 font-mono text-[10px] uppercase tracking-[0.2em] text-subtle">
            ESC
          </kbd>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="inline-flex size-8 items-center justify-center rounded-full text-text hover:text-gold hover:bg-surface-2 cursor-pointer transition-colors"
          >
            <svg aria-hidden viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2} className="size-4">
              <path d="m4 4 12 12M16 4 4 16" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* ── Results ───────────────────────────────────────────────── */}
        <div
          role="listbox"
          aria-label="Search results"
          className="overflow-y-auto max-h-[65vh]"
        >
          {/* Empty query hint */}
          {!query && (
            <div className="px-6 py-12 text-center">
              <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-gold mb-2">
                Search the shop
              </p>
              <p className="font-serif text-base text-subtle">
                Try <span className="text-text">hoodies</span>, <span className="text-text">tees</span>, or <span className="text-text">king of kings</span>
              </p>
            </div>
          )}

          {/* Empty results */}
          {showEmpty && (
            <div className="px-6 py-12 text-center">
              <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-gold mb-2">
                No matches
              </p>
              <p className="font-serif text-base text-subtle">
                Nothing found for &ldquo;<span className="text-text">{debouncedQuery}</span>&rdquo;
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="px-6 py-10 font-mono text-[11px] uppercase tracking-[0.3em] text-coral text-center">
              Search unavailable — try again
            </p>
          )}

          {/* Result items */}
          {hasResults && (
            <ul role="none" className="py-2">
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
                        "flex items-center gap-5 px-6 py-4",
                        "transition-colors cursor-pointer focus:outline-none",
                        "hover:bg-surface-2 focus:bg-surface-2",
                        activeIndex === idx && "bg-surface-2",
                      )}
                    >
                      {/* Thumbnail */}
                      <div className="relative size-16 shrink-0 bg-surface-2 overflow-hidden rounded-sm border border-border">
                        {product.image ? (
                          <Image
                            src={product.image.url}
                            alt={product.image.alt || product.name}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center font-mono text-[9px] text-subtle">
                            R1P
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex flex-col min-w-0 flex-1 gap-1">
                        <span className="font-display tracking-[0.08em] text-[1.0625rem] text-text truncate leading-tight">
                          {product.name}
                        </span>
                        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
                          {product.price.currency} {price}
                        </span>
                      </div>

                      {/* Limited badge */}
                      {product.isLimited && (
                        <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.25em] text-gold border border-gold/50 px-2 py-1">
                          Limited
                        </span>
                      )}

                      {/* Arrow */}
                      <svg
                        aria-hidden
                        className="size-4 shrink-0 text-subtle"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          {/* "See all results" footer */}
          {hasResults && results && results.total > items.length && (
            <div className="border-t border-border-strong px-6 py-4 bg-surface-1">
              <Link
                href={`${ROUTES.search}?q=${encodeURIComponent(debouncedQuery)}`}
                onClick={onClose}
                className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.3em] text-text hover:text-gold cursor-pointer transition-colors"
              >
                See all {results.total} results for &ldquo;{debouncedQuery}&rdquo;
                <span aria-hidden className="text-gold">→</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
