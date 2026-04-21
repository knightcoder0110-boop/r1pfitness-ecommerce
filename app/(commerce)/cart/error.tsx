"use client";

/**
 * Cart page error boundary.
 *
 * Fires when `CartView` throws during render — unusual since it's a pure
 * client component, but guards against unexpected store/hook failures.
 * Items in localStorage are untouched; a retry almost always succeeds.
 */
export default function CartError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-24 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted">Error</p>
      <h1 className="mt-4 font-display text-5xl tracking-wider text-text">Cart Unavailable</h1>
      <p className="mt-4 font-serif text-lg italic text-muted">
        We couldn&apos;t load your cart. Your items are saved — refresh or try again in a moment.
      </p>
      <button
        onClick={reset}
        className="mt-8 inline-flex items-center justify-center rounded-sm border border-gold bg-gold/10 px-6 py-3 font-mono text-xs uppercase tracking-[0.3em] text-gold transition-colors hover:bg-gold hover:text-bg"
      >
        Try again
      </button>
    </main>
  );
}
