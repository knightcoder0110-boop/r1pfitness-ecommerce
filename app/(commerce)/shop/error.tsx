"use client";

import Link from "next/link";
import { ROUTES } from "@/lib/constants";

/**
 * Shop listing error boundary.
 *
 * Rendered by Next.js when the shop segment (server component) throws during
 * render. Gives the user a way to retry without a full page reload.
 */
export default function ShopError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-24 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted">Error</p>
      <h1 className="mt-4 font-display text-5xl tracking-wider text-text">Shop Unavailable</h1>
      <p className="mt-4 font-serif text-lg italic text-muted">
        We hit a snag loading the shop. Your connection or our catalog may be having a moment.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <button
          onClick={reset}
          className="inline-flex items-center justify-center rounded-sm border border-gold bg-gold/10 px-6 py-3 font-mono text-xs uppercase tracking-[0.3em] text-gold transition-colors hover:bg-gold hover:text-bg"
        >
          Try again
        </button>
        <Link
          href={ROUTES.home}
          className="inline-flex items-center justify-center rounded-sm border border-border px-6 py-3 font-mono text-xs uppercase tracking-[0.3em] text-muted transition-colors hover:border-text hover:text-text"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
