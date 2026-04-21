"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { buildShopSearch, SORT_OPTIONS, type SortValue } from "@/lib/shop";
import { cn } from "@/lib/utils/cn";

interface SortSelectProps {
  /** Optional className to position/space the control. */
  className?: string;
}

/**
 * Client-side sort dropdown. Mutates only the `sort` param and resets `page`
 * to the first page so users don't land on page 4 of a freshly re-sorted list.
 *
 * Uses `router.replace` (not `push`) — sort changes shouldn't pollute history.
 * `useTransition` keeps the control interactive while the server re-renders.
 */
export function SortSelect({ className }: SortSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const current = (params.get("sort") ?? "featured") as SortValue;

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = buildShopSearch(params, {
      sort: e.target.value,
      page: null, // reset pagination
    });
    startTransition(() => {
      router.replace(`${pathname}${next ? `?${next}` : ""}`, { scroll: false });
    });
  }

  return (
    <label
      className={cn(
        "inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-muted",
        isPending && "opacity-60",
        className,
      )}
    >
      <span className="sr-only sm:not-sr-only">Sort</span>
      <select
        aria-label="Sort products"
        value={current}
        onChange={onChange}
        disabled={isPending}
        className="cursor-pointer border border-border bg-bg px-3 py-2 text-xs uppercase tracking-[0.2em] text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
