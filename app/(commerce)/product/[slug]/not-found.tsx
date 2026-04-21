import Link from "next/link";
import { ROUTES } from "@/lib/constants";

export default function ProductNotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-24 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted">404</p>
      <h1 className="mt-4 font-display text-5xl tracking-wider text-text">Piece Not Found</h1>
      <p className="mt-4 font-serif text-lg italic text-muted">
        That drop is gone. Check the shop for what&apos;s live now.
      </p>
      <Link
        href={ROUTES.shop}
        className="mt-8 inline-flex items-center justify-center rounded-sm border border-gold bg-gold/10 px-6 py-3 font-mono text-xs uppercase tracking-[0.3em] text-gold transition-colors hover:bg-gold hover:text-bg"
      >
        Shop All
      </Link>
    </main>
  );
}
