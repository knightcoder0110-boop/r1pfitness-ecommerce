import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/product";
import { ActiveFilterChips, FilterSidebar, Pagination, ShopToolbar } from "@/components/shop";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { getCatalog } from "@/lib/catalog";
import { parsePage, parseSort, parseFilters } from "@/lib/shop";
import { ROUTES, SITE } from "@/lib/constants";
import { breadcrumbSchema, collectionPageSchema } from "@/lib/seo";
import { getSiteUrl } from "@/lib/seo/site-url";
import type { ProductCategory } from "@/lib/woo/types";

/**
 * Virtual (alias) categories — slugs the homepage links to that don't yet
 * exist as real WooCommerce categories. We render a synthesized category
 * page so these URLs never 404.
 *
 *  - `bottoms` → merges Woo categories `joggers` + `shorts` into one view.
 *  - `mystery-boxes` → coming-soon state (no underlying products yet).
 *
 * Once these are created in Woo admin, delete the corresponding entry
 * and the real category will take over automatically.
 */
const VIRTUAL_CATEGORIES: Record<
  string,
  {
    category: ProductCategory;
    /** Woo slugs to merge. Empty = empty state. */
    sourceSlugs: string[];
  }
> = {
  bottoms: {
    category: {
      id: "virtual-bottoms",
      slug: "bottoms",
      name: "Bottoms",
      description: "Joggers and shorts engineered for training in the islands.",
      count: 0,
    },
    sourceSlugs: ["joggers", "shorts"],
  },
  "mystery-boxes": {
    category: {
      id: "virtual-mystery-boxes",
      slug: "mystery-boxes",
      name: "Mystery Boxes",
      description: "Curated surprise drops. Coming soon.",
      count: 0,
    },
    sourceSlugs: [],
  },
};

interface CategoryPageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<{
    sort?: string;
    page?: string;
    sizes?: string;
    colors?: string;
    price_min?: string;
    price_max?: string;
    in_stock?: string;
  }>;
}

export async function generateStaticParams() {
  try {
    const categories = await getCatalog().listCategories();
    return categories.map((c) => ({ category: c.slug }));
  } catch {
    // If Woo is unreachable at build time, skip pre-generation.
    // Pages are still rendered on-demand via dynamicParams = true (the default).
    return [];
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ category: string }> },
): Promise<Metadata> {
  const { category } = await params;
  const virtual = VIRTUAL_CATEGORIES[category];
  const match = virtual?.category ?? (await getCatalog().getCategoryBySlug(category));
  if (!match) return { title: "Not Found" };
  const canonical = `/shop/${match.slug}`;
  const description =
    match.description ||
    `${match.name} from ${SITE.legalName} — limited runs, heavyweight fabric, made in ${SITE.address.city}, ${SITE.address.region}.`;
  const ogImage = match.image?.url;
  return {
    title: match.name,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${match.name} — ${SITE.name}`,
      description,
      url: canonical,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    ...(ogImage ? { twitter: { card: "summary_large_image", images: [ogImage] } } : {}),
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { category } = await params;
  const raw = await searchParams;

  const virtual = VIRTUAL_CATEGORIES[category];
  const match = virtual?.category ?? (await getCatalog().getCategoryBySlug(category));
  if (!match) notFound();

  const filters = parseFilters(raw);

  // Virtual categories pull from zero or more real Woo slugs.
  // Empty sourceSlugs → coming-soon state (no listProducts call needed).
  const listQuery = virtual
    ? virtual.sourceSlugs.length > 0
      ? { categories: virtual.sourceSlugs }
      : null
    : { category: match.slug };

  const { items, total, page, pageCount } = listQuery
    ? await getCatalog().listProducts({
        ...listQuery,
        sort: parseSort(raw.sort),
        page: parsePage(raw.page),
        sizes: filters.sizes.length > 0 ? filters.sizes : undefined,
        colors: filters.colors.length > 0 ? filters.colors : undefined,
        priceMin: filters.priceMin,
        priceMax: filters.priceMax,
        inStock: filters.inStock || undefined,
      })
    : { items: [], total: 0, page: 1, pageCount: 1 };

  const siteUrl = getSiteUrl();
  const categoryPath = ROUTES.category(match.slug);
  const categoryUrl = `${siteUrl}${categoryPath}`;

  const breadcrumbItems = [
    { label: "Shop", href: ROUTES.shop },
    { label: match.name },
  ];

  const collectionLd = JSON.stringify(
    collectionPageSchema(match, items, categoryUrl, siteUrl),
  );
  const breadcrumbLd = JSON.stringify(
    breadcrumbSchema(
      breadcrumbItems.map((item) => ({
        name: item.label,
        url: item.href ? `${siteUrl}${item.href}` : undefined,
      })),
    ),
  );

  return (
    <Container as="main" className="py-8 sm:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: collectionLd }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: breadcrumbLd }}
      />

      <Breadcrumbs items={breadcrumbItems} className="mb-6" />

      <PageHeader
        eyebrow="Category"
        title={match.name}
        meta={<>{total} {total === 1 ? "piece" : "pieces"}</>}
        className="mb-8 sm:mb-10"
      />

      <ShopToolbar activeSlug={match.slug} currentSort={raw.sort} />

      {/* Main content: sidebar + grid */}
      <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:gap-10">
        <FilterSidebar />

        <div className="flex-1 min-w-0">
          <ActiveFilterChips className="mb-5" />

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
      </div>
    </Container>
  );
}
