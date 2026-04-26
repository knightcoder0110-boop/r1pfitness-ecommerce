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
 * Short labels keep the sort trigger compact and predictable across viewports.
 */
const SHORT_LABELS: Record<SortValue, string> = {
  featured: "Featured",
  newest: "Newest",
  "price-asc": "Price Up",
  "price-desc": "Price Down",
};

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
      <span
        aria-hidden="true"
        className={cn(
          "inline-flex items-center gap-2 whitespace-nowrap border px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted transition-colors pointer-events-none select-none sm:px-4 sm:text-xs sm:tracking-[0.25em]",
          isNonDefault ? "border-text text-text" : "border-border",
        )}
      >
        <ArrowUpDown className="h-3.5 w-3.5 shrink-0" />
        {SHORT_LABELS[current]}
      </span>
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
