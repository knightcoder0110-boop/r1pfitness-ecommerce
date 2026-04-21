"use client";

import Link from "next/link";
import { Container } from "@/components/ui/container";
import { ROUTES } from "@/lib/constants";

interface SearchErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error boundary for /search.
 *
 * Catches catalog / network errors in the SearchResults async server component.
 * Shows a branded error state with a retry button and a fallback to the full shop.
 */
export default function SearchError({ reset }: SearchErrorProps) {
  return (
    <Container as="section" className="py-10 sm:py-16">
      <div className="flex flex-col items-center gap-8 py-20 text-center">
        <div className="flex flex-col gap-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-muted">
            Search
          </p>
          <p className="font-display text-4xl tracking-widest text-muted uppercase">
            Search unavailable
          </p>
          <p className="font-serif italic text-muted max-w-sm">
            Something went wrong loading results. It&apos;s on us — try again or browse the full catalog.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          <button
            type="button"
            onClick={reset}
            className="border border-border px-6 py-3 font-mono text-xs uppercase tracking-[0.3em] text-muted transition-colors hover:border-[#C9A84C] hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]"
          >
            Try again
          </button>
          <Link
            href={ROUTES.shop}
            className="border border-[#C9A84C] px-6 py-3 font-mono text-xs uppercase tracking-[0.3em] text-[#C9A84C] transition-colors hover:bg-[#C9A84C]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]"
          >
            Browse all products →
          </Link>
        </div>
      </div>
    </Container>
  );
}
