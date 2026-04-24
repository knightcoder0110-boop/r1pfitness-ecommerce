"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { X, SlidersHorizontal } from "lucide-react";
import { buildShopSearch, parseFilters, countActiveFilters } from "@/lib/shop";
import { cn } from "@/lib/utils/cn";

// ── Static filter option sets ─────────────────────────────────────────────
// These represent the standard R1P attribute vocabulary.
// When Meilisearch is live, these will be replaced with facet values from
// the search index, so users only see options that actually exist in results.

export const SIZE_OPTIONS = ["S", "M", "L", "XL", "XXL"] as const;
export const COLOR_OPTIONS = [
  "Black",
  "Bone",
  "White",
  "Navy",
  "Olive",
  "Sand",
  "Charcoal",
  "Red",
] as const;

export const PRICE_PRESETS = [
  { label: "Under $30", min: undefined, max: 3000 },
  { label: "$30 – $50", min: 3000, max: 5000 },
  { label: "$50 – $75", min: 5000, max: 7500 },
  { label: "Over $75", min: 7500, max: undefined },
] as const;

// ── Types ─────────────────────────────────────────────────────────────────

interface FilterSidebarProps {
  className?: string;
}

// ── FilterGroup ───────────────────────────────────────────────────────────

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3 border-b border-border pb-5">
      <h3 className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">{title}</h3>
      {children}
    </div>
  );
}

// ── MultiChip ─────────────────────────────────────────────────────────────

function MultiChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        active
          ? "border-text bg-text text-bg"
          : "border-border text-muted hover:border-border-strong hover:text-text",
      )}
    >
      {label}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────

export function FilterSidebar({ className }: FilterSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const filters = parseFilters(params);
  const activeCount = countActiveFilters(filters);

  // Mobile drawer open/close state.
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Body-scroll lock when drawer is open.
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  // Close drawer on Escape.
  useEffect(() => {
    if (!drawerOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [drawerOpen]);

  const applyPatch = useCallback(
    (patch: Record<string, string | null>) => {
      const next = buildShopSearch(params, { ...patch, page: null });
      router.replace(`${pathname}${next ? `?${next}` : ""}`, { scroll: false });
    },
    [params, pathname, router],
  );

  function toggleMulti(paramKey: string, value: string, current: string[]) {
    const set = new Set(current);
    if (set.has(value)) {
      set.delete(value);
    } else {
      set.add(value);
    }
    applyPatch({ [paramKey]: set.size > 0 ? [...set].join(",") : null });
  }

  function applyPricePreset(min: number | undefined, max: number | undefined) {
    const currentMin = filters.priceMin;
    const currentMax = filters.priceMax;
    // Toggle: clicking the active preset clears it.
    if (currentMin === min && currentMax === max) {
      applyPatch({ price_min: null, price_max: null });
    } else {
      applyPatch({
        price_min: min !== undefined ? String(min) : null,
        price_max: max !== undefined ? String(max) : null,
      });
    }
  }

  function clearAll() {
    applyPatch({
      sizes: null,
      colors: null,
      price_min: null,
      price_max: null,
      in_stock: null,
      q: null,
    });
  }

  const filterPanel = (
    <div className="flex flex-col gap-5">
      {/* Header row — shown inside drawer only */}
      <div className="flex items-center justify-between lg:hidden">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-text">
          Filters {activeCount > 0 && `(${activeCount})`}
        </span>
        <button
          type="button"
          onClick={() => setDrawerOpen(false)}
          aria-label="Close filters"
          className="p-1 text-muted hover:text-text"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Clear all — only on desktop header or when filters are active */}
      {activeCount > 0 && (
        <button
          type="button"
          onClick={clearAll}
          className="self-start font-mono text-[10px] uppercase tracking-[0.2em] text-muted underline-offset-4 hover:underline hover:text-text transition-colors hidden lg:inline"
        >
          Clear all ({activeCount})
        </button>
      )}

      {/* ── Size ── */}
      <FilterGroup title="Size">
        <div className="flex flex-wrap gap-2">
          {SIZE_OPTIONS.map((size) => (
            <MultiChip
              key={size}
              label={size}
              active={filters.sizes.includes(size)}
              onClick={() => toggleMulti("sizes", size, filters.sizes)}
            />
          ))}
        </div>
      </FilterGroup>

      {/* ── Color ── */}
      <FilterGroup title="Color">
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map((color) => (
            <MultiChip
              key={color}
              label={color}
              active={filters.colors.includes(color)}
              onClick={() => toggleMulti("colors", color, filters.colors)}
            />
          ))}
        </div>
      </FilterGroup>

      {/* ── Price ── */}
      <FilterGroup title="Price">
        <div className="flex flex-col gap-2">
          {PRICE_PRESETS.map((preset) => {
            const isActive =
              filters.priceMin === preset.min && filters.priceMax === preset.max;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => applyPricePreset(preset.min, preset.max)}
                className={cn(
                  "self-start text-left font-mono text-[10px] uppercase tracking-[0.2em] transition-colors",
                  isActive ? "text-text" : "text-muted hover:text-text",
                )}
              >
                {isActive ? "✓ " : ""}{preset.label}
              </button>
            );
          })}
        </div>
      </FilterGroup>

      {/* ── Availability ── */}
      <div className="space-y-3">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">
          Availability
        </h3>
        <button
          type="button"
          onClick={() =>
            applyPatch({ in_stock: filters.inStock ? null : "1" })
          }
          className={cn(
            "inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors",
            filters.inStock ? "text-text" : "text-muted hover:text-text",
          )}
        >
          <span
            className={cn(
              "inline-flex h-3.5 w-3.5 items-center justify-center border transition-colors",
              filters.inStock ? "border-text bg-text" : "border-border",
            )}
            aria-hidden="true"
          >
            {filters.inStock && (
              <svg viewBox="0 0 10 10" className="h-2 w-2 fill-bg">
                <path d="M1 5l3 3 5-5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
          In stock only
        </button>
      </div>

      {/* Mobile-only footer: clear + apply */}
      <div className="mt-auto flex gap-3 border-t border-border pt-5 lg:hidden">
        {activeCount > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="flex-1 border border-border py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted hover:text-text transition-colors"
          >
            Clear ({activeCount})
          </button>
        )}
        <button
          type="button"
          onClick={() => setDrawerOpen(false)}
          className="flex-1 bg-text py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-bg hover:opacity-90 transition-opacity"
        >
          Show results
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Mobile trigger button ── */}
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        className={cn(
          "inline-flex items-center gap-2 border border-border px-4 py-2 font-mono text-xs uppercase tracking-[0.25em] text-muted transition-colors hover:border-border-strong hover:text-text lg:hidden",
          activeCount > 0 && "border-text text-text",
          className,
        )}
        aria-label={`Filters${activeCount > 0 ? ` (${activeCount} active)` : ""}`}
      >
        <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
        Filters
        {activeCount > 0 && (
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-text font-sans text-[9px] font-bold text-bg">
            {activeCount}
          </span>
        )}
      </button>

      {/* ── Desktop inline sidebar ── */}
      <aside
        aria-label="Product filters"
        className={cn("hidden w-56 shrink-0 flex-col gap-5 lg:flex", className)}
      >
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-text">
            Filters
          </span>
          {activeCount > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted underline-offset-4 hover:underline hover:text-text transition-colors"
            >
              Clear ({activeCount})
            </button>
          )}
        </div>
        {filterPanel}
      </aside>

      {/* ── Mobile slide-in drawer ── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Product filters"
        aria-hidden={!drawerOpen}
        className="fixed inset-0 z-[60] pointer-events-none lg:hidden"
      >
        {/* Backdrop */}
        <button
          type="button"
          aria-label="Close filters"
          onClick={() => setDrawerOpen(false)}
          tabIndex={drawerOpen ? 0 : -1}
          className={cn(
            "absolute inset-0 bg-bg/70 backdrop-blur-sm transition-opacity duration-[var(--dur-slow)]",
            drawerOpen ? "pointer-events-auto opacity-100" : "opacity-0",
          )}
        />

        {/* Panel — slides in from the left */}
        <aside
          className={cn(
            "absolute left-0 top-0 flex h-full w-full max-w-xs flex-col gap-0 bg-bg border-r border-border shadow-overlay overflow-y-auto p-6",
            "transition-transform duration-[var(--dur-slow)] ease-out",
            drawerOpen ? "pointer-events-auto translate-x-0" : "-translate-x-full",
          )}
        >
          {filterPanel}
        </aside>
      </div>
    </>
  );
}
