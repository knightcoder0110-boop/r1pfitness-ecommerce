import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Route-level loading UI for /search.
 *
 * Shown on the very first navigation to /search (before the page component
 * resolves). The inner Suspense fallback handles subsequent query changes.
 */
export default function SearchLoading() {
  return (
    <Container as="section" className="py-10 sm:py-16">
      {/* Header skeleton */}
      <header className="mb-10 sm:mb-14">
        <Skeleton className="mb-3 h-3 w-16" />
        <Skeleton className="h-12 w-full max-w-lg sm:h-16" />
      </header>

      {/* Controls bar skeleton */}
      <div className="mt-8 mb-6 flex items-center justify-between">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-28" />
      </div>

      {/* Grid skeleton */}
      <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4" aria-busy="true" aria-label="Loading search results">
        {Array.from({ length: 8 }).map((_, i) => (
          <li key={i} className="flex flex-col gap-3">
            <Skeleton className="aspect-card w-full" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
          </li>
        ))}
      </ul>
    </Container>
  );
}
