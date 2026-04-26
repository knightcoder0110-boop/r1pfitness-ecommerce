"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown } from "lucide-react";
import { buildShopSearch, SORT_OPTIONS, type SortValue } from "@/lib/shop";
import { cn } from "@/lib/utils/cn";

interface SortSelectProps {
  className?: string;
}

/**
 * Short label shown inside the compact trigger button.
 * Keeps the button width predictable regardless of the active sort.
 */
const SHORT_LABELS: Record<SortValue, string> = {
  featured:   "Featured",
  newest:     "Newest",
  "price-asc":  "Price ↑",
  "price-desc": "Price ↓",
};

/**
 * Client-side sort control styled to match the FilterSidebar trigger.
 *
 * Visual: a compact bordered button (icon + short label). The native
 * <select> is stretched over the button with opacity-0 so the OS picker
 * fires on click while we control the visual entirely. This avoids custom
 * dropdown code, keeps accessibility intact, and stays mobile-native.
 */
export function SortSelect({ className }: SortSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const current = (params.get("sort") ?? "featured") as SortValue;
  const isNonDefault = current !== "featured";

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = buildShopSearch(params, {
      sort: e.target.value,
      page: null,
    });
    startTransition(() => {
      router.replace(`${pathname}${next ? `?${next}` : ""}`, { scroll: false });
    });
  }

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0",
        isPending && "opacity-60",
        className,
      )}
    >
      {/* Visual button — purely presentational, pointer-events blocked so
          the transparent <select> above captures all interactions. */}
      <span
        aria-hidden="true"
        className={cn(
          "inline-flex items-center gap-2 border px-4 py-2 font-mono text-xs uppercase tracking-[0.25em] transition-colors pointer-events-none select-none",
          isNonDefault
            ? "border-text text-text"
            : "border-border text-muted",
        )}
      >
        <ArrowUpDown className="h-3.5 w-3.5 shrink-0" />
        {SHORT_LABELS[current]}
      </span>

      {/* Native <select> stretched over the visual button.
          opacity-0 hides it visually; it still receives pointer events
          and fires the OS picker on tap/click. */}
      <select
        aria-label="Sort products"
        value={current}
        onChange={onChange}
        disabled={isPending}
        className="absolute inset-0 w-full cursor-pointer opacity-0"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
