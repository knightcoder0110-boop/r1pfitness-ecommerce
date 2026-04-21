"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { buildShopSearch, parseSearch } from "@/lib/shop";
import { cn } from "@/lib/utils/cn";

interface SearchBarProps {
  className?: string;
  placeholder?: string;
}

/**
 * Client-side search box. On submit it patches `?q=...` and resets paging.
 * We keep a local controlled input so typing feels instant; the URL update
 * happens on submit (Enter / button click) and on "clear".
 *
 * If the URL's `q` changes externally (e.g. browser back), we resync.
 */
export function SearchBar({ className, placeholder = "Search the drop" }: SearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const urlQ = params.get("q") ?? "";
  const [value, setValue] = useState(urlQ);

  // Keep local input in sync with URL (back/forward navigation).
  useEffect(() => {
    setValue(urlQ);
  }, [urlQ]);

  function commit(raw: string) {
    const q = parseSearch(raw);
    const next = buildShopSearch(params, { q: q || null, page: null });
    startTransition(() => {
      router.replace(`${pathname}${next ? `?${next}` : ""}`, { scroll: false });
    });
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    commit(value);
  }

  function onClear() {
    setValue("");
    commit("");
  }

  return (
    <form
      role="search"
      onSubmit={onSubmit}
      className={cn("relative flex items-center", className)}
    >
      <Search
        aria-hidden
        className="pointer-events-none absolute left-3 h-4 w-4 text-muted"
      />
      <input
        type="search"
        name="q"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label="Search products"
        autoComplete="off"
        className="w-full border border-border bg-bg pl-9 pr-9 py-2 font-mono text-sm text-text placeholder:text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      />
      {value ? (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear search"
          className="absolute right-2 p-1 text-muted transition-colors hover:text-text"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </form>
  );
}
