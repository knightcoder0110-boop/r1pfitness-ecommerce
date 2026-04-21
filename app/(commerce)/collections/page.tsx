import type { Metadata } from "next";
import Link from "next/link";
import { getCatalog } from "@/lib/catalog";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { ROUTES } from "@/lib/constants";

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
    <Container as="main" className="py-12 sm:py-20">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <header className="mb-12 sm:mb-16">
        <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-muted mb-3">
          Shop by Category
        </p>
        <Heading level={1} size="xl" className="text-3xl sm:text-5xl">
          All Collections
        </Heading>
        <p className="mt-3 font-serif italic text-subtle max-w-lg">
          Limited drops across every category. 24 hours only — no restocks, no exceptions.
        </p>
      </header>

      {/* ── Grid ──────────────────────────────────────────────────────── */}
      {displayCategories.length > 0 ? (
        <ul
          role="list"
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
        >
          {displayCategories.map((cat) => (
            <li key={cat.slug}>
              <Link
                href={ROUTES.category(cat.slug)}
                className="group relative flex flex-col overflow-hidden border border-border hover:border-gold/40 transition-colors duration-300"
              >
                {/* Category placeholder image */}
                <div className="relative aspect-[4/5] bg-[#1A1A1A] overflow-hidden flex items-center justify-center">
                  <span className="font-display text-6xl tracking-wider text-text/10 select-none">
                    {cat.name.charAt(0).toUpperCase()}
                  </span>
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                </div>

                {/* Label */}
                <div className="p-4 flex items-end justify-between">
                  <div>
                    <p className="font-display text-lg tracking-wider text-text group-hover:text-gold transition-colors">
                      {cat.name}
                    </p>
                  </div>
                  <span
                    className="font-mono text-xs text-muted group-hover:text-gold group-hover:translate-x-1 transition-all duration-200"
                    aria-hidden
                  >
                    →
                  </span>
                </div>
              </Link>
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
