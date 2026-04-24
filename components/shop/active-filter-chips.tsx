"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { buildShopSearch, parseFilters, countActiveFilters } from "@/lib/shop";
import { cn } from "@/lib/utils/cn";
import { PRICE_PRESETS } from "./filter-sidebar";

/**
 * ActiveFilterChips — shows one dismissible pill per active filter,
 * plus a "Clear all" button when multiple filters are set.
 *
 * Reads filter state from URL searchParams. Each chip mutates the URL
 * via router.replace to remove that single filter.
 */
export function ActiveFilterChips({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const filters = parseFilters(params);
  const activeCount = countActiveFilters(filters);

  if (activeCount === 0) return null;

  function removePatch(patch: Record<string, string | null>) {
    const next = buildShopSearch(params, { ...patch, page: null });
    router.replace(`${pathname}${next ? `?${next}` : ""}`, { scroll: false });
  }

  function clearAll() {
    removePatch({
      sizes: null,
      colors: null,
      price_min: null,
      price_max: null,
      in_stock: null,
      q: null,
    });
  }

  function removeSize(size: string) {
    const next = filters.sizes.filter((s) => s !== size);
    removePatch({ sizes: next.length > 0 ? next.join(",") : null });
  }

  function removeColor(color: string) {
    const next = filters.colors.filter((c) => c !== color);
    removePatch({ colors: next.length > 0 ? next.join(",") : null });
  }

  function clearPrice() {
    removePatch({ price_min: null, price_max: null });
  }

  // Find matching price preset label.
  const priceLabel = PRICE_PRESETS.find(
    (p) => p.min === filters.priceMin && p.max === filters.priceMax,
  )?.label;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {filters.sizes.map((size) => (
        <Chip key={`size-${size}`} label={`Size: ${size}`} onRemove={() => removeSize(size)} />
      ))}

      {filters.colors.map((color) => (
        <Chip
          key={`color-${color}`}
          label={`Color: ${color}`}
          onRemove={() => removeColor(color)}
        />
      ))}

      {(filters.priceMin !== undefined || filters.priceMax !== undefined) && (
        <Chip label={priceLabel ?? "Price filter"} onRemove={clearPrice} />
      )}

      {filters.inStock && (
        <Chip label="In stock" onRemove={() => removePatch({ in_stock: null })} />
      )}

      {activeCount > 1 && (
        <button
          type="button"
          onClick={clearAll}
          className="ml-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted underline-offset-4 hover:underline hover:text-text transition-colors"
        >
          Clear all
        </button>
      )}
    </div>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 border border-border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-text">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
        className="text-muted hover:text-text transition-colors"
      >
        <X className="h-2.5 w-2.5" aria-hidden="true" />
      </button>
    </span>
  );
}
