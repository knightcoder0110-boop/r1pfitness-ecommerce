/**
 * Skeleton placeholders for the section components. Keep them framework-free
 * (no async, no data) so they can sit inside `<Suspense fallback={...}>` or
 * be rendered inline during loading states.
 */

import { cn } from "@/lib/utils/cn";

/**
 * Matches the portrait `<CategoryCard>` dimensions so there is no layout
 * shift when real content streams in.
 */
export function CategoryCardSkeleton({
  variant = "portrait",
  className,
}: {
  variant?: "grid" | "portrait" | "scroller";
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "flex flex-col overflow-hidden rounded-sm border border-white/[0.06]",
        variant === "scroller" && "shrink-0 w-[72vw] max-w-[260px] sm:w-52 md:w-60 lg:w-64",
        className,
      )}
    >
      <div
        className={cn(
          "relative animate-pulse bg-surface-1",
          variant === "grid" && "aspect-collection-cover",
          (variant === "portrait" || variant === "scroller") && "aspect-editorial",
        )}
      />
      <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-4 bg-surface-1 border-t border-white/[0.06]">
        <div className="flex flex-col gap-2 min-w-0 w-full">
          <div className="h-4 bg-surface-2 animate-pulse rounded-sm w-2/3" />
          <div className="h-2 bg-surface-2 animate-pulse rounded-sm w-1/3" />
        </div>
        <div className="size-8 sm:size-9 shrink-0 rounded-full bg-surface-2 animate-pulse" />
      </div>
    </div>
  );
}

/**
 * Skeleton approximation of `<ShopByCategorySection>` during initial load.
 * Use as `<Suspense fallback={<ShopByCategorySectionSkeleton />}>`.
 */
export function ShopByCategorySectionSkeleton({
  count = 4,
  layout = "grid",
}: {
  count?: number;
  layout?: "grid" | "bento" | "scroller";
}) {
  return (
    <section aria-hidden className="py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <header className="flex items-end justify-between gap-6 mb-8 sm:mb-10 lg:mb-12">
          <div className="flex flex-col gap-3 w-full max-w-md">
            <div className="h-3 w-24 bg-surface-2 animate-pulse rounded-sm" />
            <div className="h-10 w-3/4 bg-surface-1 animate-pulse rounded-sm" />
            <div className="h-3 w-1/2 bg-surface-2 animate-pulse rounded-sm" />
          </div>
        </header>
        {layout === "scroller" ? (
          <div className="flex gap-3 sm:gap-4 overflow-hidden">
            {Array.from({ length: count }).map((_, i) => (
              <CategoryCardSkeleton key={i} variant="scroller" />
            ))}
          </div>
        ) : (
          <div
            className={cn(
              "grid gap-3 sm:gap-4",
              "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
            )}
          >
            {Array.from({ length: count }).map((_, i) => (
              <CategoryCardSkeleton key={i} variant={layout === "bento" ? "grid" : "portrait"} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * Skeleton for `<FeaturedCollectionSection>` — mirrors `<ProductRail>` layout
 * at a high level (gold rule, eyebrow, title, 4-up grid).
 */
export function FeaturedCollectionSectionSkeleton({
  productCount = 4,
}: {
  productCount?: number;
}) {
  return (
    <section aria-hidden className="py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-[1536px] px-4 sm:px-6 lg:px-8">
        <header className="mb-8 sm:mb-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="h-px w-8 bg-gold" aria-hidden />
            <div className="h-3 w-28 bg-surface-2 animate-pulse rounded-sm" />
          </div>
          <div className="h-10 w-2/3 bg-surface-1 animate-pulse rounded-sm" />
        </header>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: productCount }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3">
              <div className="aspect-product bg-surface-1 animate-pulse rounded-sm" />
              <div className="h-3 w-3/4 bg-surface-2 animate-pulse rounded-sm" />
              <div className="h-3 w-1/3 bg-surface-2 animate-pulse rounded-sm" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
