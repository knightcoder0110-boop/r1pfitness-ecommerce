import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/product";
import { getCatalog } from "@/lib/catalog";

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
    description: `${match.name} from R1P FITNESS — limited runs, heavyweight fabric, made in Waipahu, HI.`,
    alternates: { canonical },
    openGraph: {
      title: `${match.name} — R1P FITNESS`,
      url: canonical,
    },
  };
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

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { category } = await params;
  const { sort, page } = await searchParams;

  const match = await getCatalog().getCategoryBySlug(category);
  if (!match) notFound();

  const { items, total } = await getCatalog().listProducts({
    category: match.slug,
    sort: parseSort(sort),
    page: page ? Number(page) : 1,
  });

  return (
    <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <header className="mb-12">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-text/50">Category</p>
        <h1 className="mt-2 font-display text-5xl tracking-wider text-text sm:text-6xl">
          {match.name}
        </h1>
        <p className="mt-2 font-mono text-xs uppercase tracking-[0.3em] text-text/50">
          {total} {total === 1 ? "piece" : "pieces"}
        </p>
      </header>

      <ProductGrid items={items} />
    </main>
  );
}
