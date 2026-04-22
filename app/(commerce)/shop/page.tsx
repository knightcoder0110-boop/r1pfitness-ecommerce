import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductGrid } from "@/components/product";
import { CategoryChips, Pagination, SearchBar, SortSelect } from "@/components/shop";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Skeleton } from "@/components/ui/skeleton";
import { getCatalog } from "@/lib/catalog";
import { parsePage, parseSearch, parseSort } from "@/lib/shop";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "The full R1P catalog - heavyweight tees, hoodies, shorts, and accessories. Made in limited runs in Waipahu, HI.",
  alternates: { canonical: "/shop" },
  openGraph: {
    title: "Shop - R1P FITNESS",
    description: "The full R1P catalog - limited drops from Waipahu, HI.",
    url: "/shop",
  },
};

interface ShopPageProps {
  searchParams: Promise<{
    sort?: string;
    page?: string;
    q?: string;
  }>;
}

async function ShopProducts({ searchParams }: ShopPageProps) {
  const raw = await searchParams;
  const q = parseSearch(raw.q);
  const { items, total, pageCount, page } = await getCatalog().listProducts({
    sort: parseSort(raw.sort),
    page: parsePage(raw.page),
    ...(q ? { search: q } : {}),
  });

  if (items.length === 0) {
    return (
      <div className="mt-8 flex flex-col items-center gap-4 border border-dashed border-border py-16 text-center">
        <p className="font-display text-2xl tracking-wider text-muted">
          No pieces match that search
        </p>
        {q ? (
          <p className="max-w-md font-mono text-xs uppercase tracking-[0.2em] text-subtle">
            No results for &ldquo;{q}&rdquo; - try a different term or clear the search.
          </p>
        ) : (
          <p className="max-w-md font-mono text-xs uppercase tracking-[0.2em] text-subtle">
            Nothing in the catalog right now. Check back soon.
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="mt-8 mb-6 flex items-baseline justify-between">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted">
          {total} {total === 1 ? "piece" : "pieces"}
          {q ? <> &middot; <span className="text-text">&ldquo;{q}&rdquo;</span></> : null}
        </p>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted">
          Page {page} / {pageCount}
        </p>
      </div>
      <ProductGrid items={items} />
      <Pagination
        page={page}
        pageCount={pageCount}
        basePath="/shop"
        searchParams={raw}
      />
    </>
  );
}

function ShopSkeleton() {
  return (
    <ul className="mt-8 grid grid-cols-2 gap-x-5 gap-y-12 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 8 }).map((_, i) => (
        <li key={i} className="flex flex-col gap-3">
          <Skeleton className="aspect-card w-full" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
        </li>
      ))}
    </ul>
  );
}

export default async function ShopPage(props: ShopPageProps) {
  // Resolving here so <Suspense key> remounts on param change.
  const suspenseKey = JSON.stringify(await props.searchParams);

  return (
    <Container as="main" size="xl" className="py-10 sm:py-16">
      <header className="mb-8 sm:mb-10">
        <Heading level={1} size="xl" className="text-4xl sm:text-5xl lg:text-6xl">
          Shop
        </Heading>
        <p className="mt-2 max-w-xl font-serif text-base sm:text-lg italic text-muted">
          Limited runs. Heavyweight fabric. Made with intention.
        </p>
      </header>

      <div className="flex flex-col gap-4">
        <CategoryChips activeSlug={null} />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SearchBar className="sm:max-w-xs" />
          <SortSelect />
        </div>
      </div>

      <Suspense key={suspenseKey} fallback={<ShopSkeleton />}>
        <ShopProducts {...props} />
      </Suspense>
    </Container>
  );
}
