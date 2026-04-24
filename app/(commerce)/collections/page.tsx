import type { Metadata } from "next";
import { getCatalog } from "@/lib/catalog";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { CategoryCard } from "@/components/sections";

export const metadata: Metadata = {
  title: "Collections — R1P FITNESS",
  description:
    "Browse all R1P FITNESS collections — tees, hoodies, bottoms, caps, activewear, and accessories. Limited drops, Hawaiian streetwear.",
  alternates: { canonical: "/collections" },
};

export const revalidate = 3600;

export default async function CollectionsPage() {
  const catalog = getCatalog();
  const categories = await catalog.listCategories();

  // Filter out the uncategorized / root category
  const displayCategories = categories.filter((c) => c.slug !== "uncategorized");

  return (
    <Container as="main" className="py-8 sm:py-10">
      <Breadcrumbs items={[{ label: "Collections" }]} className="mb-6" />

      <PageHeader
        eyebrow="Shop by Category"
        title="All Collections"
        subtitle="Limited drops across every category. 24 hours only — no restocks, no exceptions."
        className="mb-12 sm:mb-16"
      />

      {/* ── Grid ──────────────────────────────────────────────────────── */}
      {displayCategories.length > 0 ? (
        <ul
          role="list"
          className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-4"
        >
          {displayCategories.map((cat, i) => (
            <li key={cat.slug}>
              <CategoryCard
                category={cat}
                index={i}
                variant="portrait"
                priority={i < 4}
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <p className="font-display text-2xl tracking-wider text-muted">
            Drop coming soon
          </p>
          <p className="font-serif italic text-subtle max-w-sm">
            Collections go live when the drop does. Stay tuned — get on the list.
          </p>
        </div>
      )}
    </Container>
  );
}
