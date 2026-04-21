import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductGrid } from "@/components/product";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Skeleton } from "@/components/ui/skeleton";
import { getCatalog } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "The full R1P catalog — heavyweight tees, hoodies, shorts, and accessories. Made in limited runs in Waipahu, HI.",
  alternates: { canonical: "/shop" },
  openGraph: {
    title: "Shop — R1P FITNESS",
    description: "The full R1P catalog — limited drops from Waipahu, HI.",
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

function parseSort(value: string | undefined) {
  switch (value) {
    case "price-asc":
    case "price-desc":
    case "newest":
    case "featured":
      return value;
    default:
      return "featured" as const;
  }
}

async function ShopProducts({ searchParams }: ShopPageProps) {
  const { sort, page, q } = await searchParams;
  const { items, total, pageCount, page: currentPage } = await getCatalog().listProducts({
    sort: parseSort(sort),
    page: page ? Number(page) : 1,
    ...(q ? { search: q } : {}),
  });

  return (
    <>
      <div className="mb-8 flex items-baseline justify-between">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted">
          {total} {total === 1 ? "piece" : "pieces"}
        </p>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted">
          Page {currentPage} / {pageCount}
        </p>
      </div>
      <ProductGrid items={items} />
    </>
  );
}

function ShopSkeleton() {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <li key={i} className="flex flex-col gap-3">
          <Skeleton className="aspect-[4/5] w-full" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
        </li>
      ))}
    </ul>
  );
}

export default function ShopPage(props: ShopPageProps) {
  return (
    <Container as="main" className="py-10 sm:py-16">
      <header className="mb-10 sm:mb-12">
        <Heading level={1} size="xl" className="text-4xl sm:text-5xl lg:text-6xl">
          Shop
        </Heading>
        <p className="mt-2 max-w-xl font-serif text-base sm:text-lg italic text-muted">
          Limited runs. Heavyweight fabric. Made with intention.
        </p>
      </header>

      <Suspense fallback={<ShopSkeleton />}>
        <ShopProducts {...props} />
      </Suspense>
    </Container>
  );
}
