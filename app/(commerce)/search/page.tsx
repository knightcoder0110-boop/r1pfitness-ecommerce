import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ProductGrid } from "@/components/product";
import { SortSelect, Pagination } from "@/components/shop";
import { SearchInput } from "@/components/search/search-input";
import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";
import { getCatalog } from "@/lib/catalog";
import { parsePage, parseSearch, parseSort } from "@/lib/shop";
import { ROUTES } from "@/lib/constants";

// ── Metadata ──────────────────────────────────────────────────────────────────

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    sort?: string;
    page?: string;
  }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams;
  const query = parseSearch(q);
  return {
    title: query
      ? `"${query}" — Search — R1P FITNESS`
      : "Search — R1P FITNESS",
    description: query
      ? `Search results for "${query}" — Limited edition Hawaiian streetwear from R1P FITNESS.`
      : "Search the full R1P FITNESS catalog — limited drops, heavyweight fabric, Waipahu, HI.",
    robots: {
      index: false,  // search result pages must never be indexed
      follow: true,
    },
  };
}

// ── Popular categories shown when no query is active ──────────────────────────

const POPULAR_SEARCHES = [
  { label: "Tees",        href: ROUTES.category("tees") },
  { label: "Hoodies",     href: ROUTES.category("hoodies") },
  { label: "Shorts",      href: ROUTES.category("shorts") },
  { label: "Accessories", href: ROUTES.category("accessories") },
];

const KEYWORD_SUGGESTIONS = [
  "Paradise", "R1P", "Limited", "Drop", "Gym", "Waipahu",
];

// ── Empty-state variants ───────────────────────────────────────────────────────

function NoQueryState() {
  return (
    <div className="mt-16 flex flex-col items-center gap-10 text-center">
      <div className="flex flex-col gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-muted">
          Browse by category
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {POPULAR_SEARCHES.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="border border-border px-5 py-2.5 font-mono text-xs uppercase tracking-[0.25em] text-muted transition-colors hover:border-[#C9A84C] hover:text-text"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-muted">
          Popular searches
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {KEYWORD_SUGGESTIONS.map((kw) => (
            <Link
              key={kw}
              href={`${ROUTES.search}?q=${encodeURIComponent(kw)}`}
              className="font-mono text-[11px] uppercase tracking-[0.2em] text-subtle underline underline-offset-4 decoration-border hover:text-text hover:decoration-[#C9A84C] transition-colors"
            >
              {kw}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function NoResultsState({ query }: { query: string }) {
  return (
    <div className="mt-16 flex flex-col items-center gap-8 text-center">
      <div className="flex flex-col gap-3">
        <p className="font-display text-4xl tracking-widest text-muted uppercase">
          Nothing found
        </p>
        <p className="font-serif italic text-muted">
          No pieces match &ldquo;{query}&rdquo; — try a different term or browse the full catalog.
        </p>
      </div>

      <div className="flex flex-col items-center gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-muted">
          Try instead
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {KEYWORD_SUGGESTIONS.map((kw) => (
            <Link
              key={kw}
              href={`${ROUTES.search}?q=${encodeURIComponent(kw)}`}
              className="font-mono text-[11px] uppercase tracking-[0.2em] text-subtle underline underline-offset-4 decoration-border hover:text-text hover:decoration-[#C9A84C] transition-colors"
            >
              {kw}
            </Link>
          ))}
        </div>
      </div>

      <Link
        href={ROUTES.shop}
        className="mt-2 border border-border px-6 py-3 font-mono text-xs uppercase tracking-[0.3em] text-muted transition-colors hover:border-[#C9A84C] hover:text-text"
      >
        Browse all products →
      </Link>
    </div>
  );
}

// ── Result count announcer (screen readers) ───────────────────────────────────

function ResultAnnouncer({ total, query }: { total: number; query: string }) {
  const msg = total === 0
    ? `No results for "${query}"`
    : `${total} ${total === 1 ? "result" : "results"} for "${query}"`;

  return (
    <span className="sr-only" aria-live="polite" aria-atomic="true">
      {msg}
    </span>
  );
}

// ── Async results block (runs inside Suspense) ────────────────────────────────

async function SearchResults({ searchParams }: SearchPageProps) {
  const raw = await searchParams;
  const q = parseSearch(raw.q);
  const sort = parseSort(raw.sort);
  const page = parsePage(raw.page);

  // Empty query — show the discovery state instead of hitting the catalog.
  if (!q) return <NoQueryState />;

  // Too short — the API would return empty anyway but this is friendlier.
  if (q.length < 2) {
    return (
      <p
        role="status"
        aria-live="polite"
        className="mt-16 text-center font-mono text-xs uppercase tracking-[0.3em] text-muted"
      >
        Keep going — need at least 2 characters
      </p>
    );
  }

  const { items, total, pageCount } = await getCatalog().listProducts({
    search: q,
    sort,
    page,
  });

  return (
    <>
      {/* Screen-reader announcement */}
      <ResultAnnouncer total={total} query={q} />

      {total === 0 ? (
        <NoResultsState query={q} />
      ) : (
        <>
          {/* Controls bar */}
          <div className="mt-8 mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted" aria-live="polite">
              <span className="text-text">{total}</span>{" "}
              {total === 1 ? "piece" : "pieces"} for{" "}
              <span className="text-[#C9A84C]">&ldquo;{q}&rdquo;</span>
              {pageCount > 1 && (
                <span className="ml-3 text-subtle">
                  · Page {page} / {pageCount}
                </span>
              )}
            </p>
            <SortSelect />
          </div>

          {/* Product grid */}
          <ProductGrid items={items} />

          {/* Pagination — preserves q + sort across pages */}
          <Pagination
            page={page}
            pageCount={pageCount}
            basePath={ROUTES.search}
            searchParams={raw}
          />
        </>
      )}
    </>
  );
}

// ── Skeleton shown while results are loading ───────────────────────────────────

function SearchSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading search results">
      {/* Controls bar skeleton */}
      <div className="mt-8 mb-6 flex items-center justify-between">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-28" />
      </div>
      {/* Grid skeleton */}
      <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <li key={i} className="flex flex-col gap-3">
            <Skeleton className="aspect-card w-full" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function SearchPage(props: SearchPageProps) {
  // Resolve once so we can use the value in the Suspense key.
  // Suspense key change = full remount, which replaces stale skeleton with
  // fresh results without a flash of the old content.
  const raw = await props.searchParams;
  const suspenseKey = `${raw.q ?? ""}:${raw.sort ?? ""}:${raw.page ?? ""}`;

  return (
    <Container as="section" className="py-10 sm:py-16">
      {/* Page header */}
      <header className="mb-10 sm:mb-14">
        <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-muted mb-3">
          Search
        </p>

        {/* The big search input — client component */}
        <SearchInput />
      </header>

      {/* Results area — re-mounts on every query/sort/page change */}
      <Suspense key={suspenseKey} fallback={<SearchSkeleton />}>
        <SearchResults {...props} />
      </Suspense>
    </Container>
  );
}
