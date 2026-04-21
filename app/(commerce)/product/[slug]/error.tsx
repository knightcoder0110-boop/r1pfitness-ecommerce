"use client";

import Link from "next/link";
import { ROUTES } from "@/lib/constants";

/**
 * Product detail page error boundary.
 *
 * Fires when the PDP server component throws — e.g. the WooCommerce Store API
 * times out. Distinct from `not-found.tsx` which handles 404s.
 */
export default function ProductError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-24 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted">Error</p>
      <h1 className="mt-4 font-display text-5xl tracking-wider text-text">
        Something Went Wrong
      </h1>
      <p className="mt-4 font-serif text-lg italic text-muted">
        We couldn&apos;t load this product right now. It may still be available — try again in a
        moment.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <button
          onClick={reset}
          className="inline-flex items-center justify-center rounded-sm border border-gold bg-gold/10 px-6 py-3 font-mono text-xs uppercase tracking-[0.3em] text-gold transition-colors hover:bg-gold hover:text-bg"
        >
          Try again
        </button>
        <Link
          href={ROUTES.shop}
          className="inline-flex items-center justify-center rounded-sm border border-border px-6 py-3 font-mono text-xs uppercase tracking-[0.3em] text-muted transition-colors hover:border-text hover:text-text"
        >
          Back to shop
        </Link>
      </div>
    </main>
  );
}
