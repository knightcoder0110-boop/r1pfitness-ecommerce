import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/product";
import { Pagination, ShopToolbar } from "@/components/shop";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { getCatalog } from "@/lib/catalog";
import { parsePage, parseSort } from "@/lib/shop";

interface CategoryPageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ sort?: string; page?: string }>;
}

export async function generateStaticParams() {
  const categories = await getCatalog().listCategories();
  return categories.map((c) => ({ category: c.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ category: string }> },
): Promise<Metadata> {
  const { category } = await params;
  const match = await getCatalog().getCategoryBySlug(category);
  if (!match) return { title: "Not Found" };
  const canonical = `/shop/${match.slug}`;
  return {
    title: match.name,
    description: `${match.name} from R1P FITNESS - limited runs, heavyweight fabric, made in Waipahu, HI.`,
    alternates: { canonical },
    openGraph: {
      title: `${match.name} - R1P FITNESS`,
      url: canonical,
    },
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { category } = await params;
  const raw = await searchParams;

  const match = await getCatalog().getCategoryBySlug(category);
  if (!match) notFound();

  const { items, total, page, pageCount } = await getCatalog().listProducts({
    category: match.slug,
    sort: parseSort(raw.sort),
    page: parsePage(raw.page),
  });

  return (
    <Container as="main" className="py-8 sm:py-10">
      <Breadcrumbs
        items={[
          { label: "Shop", href: "/shop" },
          { label: match.name },
        ]}
        className="mb-6"
      />

      <PageHeader
        eyebrow="Category"
        title={match.name}
        meta={<>{total} {total === 1 ? "piece" : "pieces"}</>}
        className="mb-8 sm:mb-10"
      />

      <div className="flex flex-col gap-4">
        <ShopToolbar activeSlug={match.slug} />
      </div>

      <div className="mt-8">
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-4 border border-dashed border-border py-16 text-center">
            <p className="font-display text-2xl tracking-wider text-muted">
              Nothing here yet
            </p>
            <p className="max-w-md font-mono text-xs uppercase tracking-[0.2em] text-subtle">
              This category is between drops. Check the full shop.
            </p>
          </div>
        ) : (
          <>
            <ProductGrid items={items} />
            <Pagination
              page={page}
              pageCount={pageCount}
              basePath={`/shop/${match.slug}`}
              searchParams={raw}
            />
          </>
        )}
      </div>
    </Container>
  );
}
