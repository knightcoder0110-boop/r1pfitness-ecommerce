import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buildShopSearch } from "@/lib/shop";
import { cn } from "@/lib/utils/cn";

interface PaginationProps {
  /** 1-based current page. */
  page: number;
  /** Total number of pages. */
  pageCount: number;
  /** Route path without query (e.g. `/shop` or `/shop/tees`). */
  basePath: string;
  /** Existing URL params to preserve (sort, q, etc.). */
  searchParams: Record<string, string | string[] | undefined>;
  className?: string;
}

/**
 * Server-rendered pagination. Plain `<Link>`s so the full server re-render
 * happens on navigation — simpler and SEO-friendly than a client control.
 * Each link carries the full search state so sort/q persist across pages.
 *
 * Windowed display: always shows first, last, current, and 1 neighbour each
 * side, with `…` placeholders between gaps. Hidden entirely when pageCount <= 1.
 */
export function Pagination({
  page,
  pageCount,
  basePath,
  searchParams,
  className,
}: PaginationProps) {
  if (pageCount <= 1) return null;

  const visible = computeWindow(page, pageCount);

  function hrefFor(n: number) {
    const query = buildShopSearch(searchParams, { page: n });
    return `${basePath}${query ? `?${query}` : ""}`;
  }

  const prev = page > 1 ? hrefFor(page - 1) : null;
  const next = page < pageCount ? hrefFor(page + 1) : null;

  return (
    <nav
      aria-label="Pagination"
      className={cn("mt-12 flex items-center justify-center gap-1 sm:gap-2", className)}
    >
      <PageArrow href={prev} direction="prev" />

      <ul className="flex items-center gap-1 sm:gap-2">
        {visible.map((entry, i) =>
          entry === "ellipsis" ? (
            <li
              key={`ellipsis-${i}`}
              aria-hidden
              className="px-2 font-mono text-xs text-subtle"
            >
              …
            </li>
          ) : (
            <li key={entry}>
              <PageLink href={hrefFor(entry)} current={entry === page}>
                {entry}
              </PageLink>
            </li>
          ),
        )}
      </ul>

      <PageArrow href={next} direction="next" />
    </nav>
  );
}

function PageLink({
  href,
  current,
  children,
}: {
  href: string;
  current: boolean;
  children: React.ReactNode;
}) {
  const base =
    "inline-flex h-9 min-w-9 items-center justify-center border px-3 font-mono text-xs uppercase tracking-[0.2em] tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";
  if (current) {
    return (
      <span
        aria-current="page"
        className={cn(base, "border-text bg-text text-bg cursor-default")}
      >
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className={cn(base, "border-border text-muted hover:border-border-strong hover:text-text")}
    >
      {children}
    </Link>
  );
}

function PageArrow({
  href,
  direction,
}: {
  href: string | null;
  direction: "prev" | "next";
}) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;
  const label = direction === "prev" ? "Previous page" : "Next page";
  const base =
    "inline-flex h-9 w-9 items-center justify-center border transition-colors";

  if (!href) {
    return (
      <span
        aria-label={label}
        aria-disabled="true"
        className={cn(base, "border-border text-faint cursor-not-allowed")}
      >
        <Icon className="h-4 w-4" />
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-label={label}
      rel={direction === "prev" ? "prev" : "next"}
      className={cn(
        base,
        "border-border text-muted hover:border-border-strong hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
      )}
    >
      <Icon className="h-4 w-4" />
    </Link>
  );
}

/**
 * Decide which page numbers / ellipses to show.
 * Rules: always include 1 and pageCount. Around `page`, include +-1.
 * Collapse larger gaps with a single ellipsis marker.
 */
export function computeWindow(
  page: number,
  pageCount: number,
): (number | "ellipsis")[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }

  const pages = new Set<number>([1, pageCount, page, page - 1, page + 1]);
  const nums = Array.from(pages)
    .filter((n) => n >= 1 && n <= pageCount)
    .sort((a, b) => a - b);

  const result: (number | "ellipsis")[] = [];
  let prev = 0;
  for (const n of nums) {
    if (n - prev > 1) result.push("ellipsis");
    result.push(n);
    prev = n;
  }
  return result;
}
