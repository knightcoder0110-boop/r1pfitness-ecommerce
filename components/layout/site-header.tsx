import Link from "next/link";
import { CartButton } from "@/components/cart/cart-button";
import { ROUTES } from "@/lib/constants";
import { SITE } from "@/lib/constants";

/**
 * Persistent site header. Server component — the only client bit is the
 * `<CartButton>` which has `"use client"` at its boundary.
 *
 * Keep this lean — no mega-menu until we have more than 5 categories.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-text/10 bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href={ROUTES.home}
          aria-label={`${SITE.name} home`}
          className="font-display text-xl tracking-[0.25em] text-text transition-opacity hover:opacity-80"
        >
          {SITE.name}
        </Link>

        <nav aria-label="Primary" className="hidden sm:block">
          <ul className="flex items-center gap-8 font-mono text-xs uppercase tracking-[0.25em] text-text/70">
            <li>
              <Link href={ROUTES.shop} className="transition-colors hover:text-text">
                Shop
              </Link>
            </li>
            <li>
              <Link href="/shop/tees" className="transition-colors hover:text-text">
                Tees
              </Link>
            </li>
            <li>
              <Link href="/shop/hoodies" className="transition-colors hover:text-text">
                Hoodies
              </Link>
            </li>
          </ul>
        </nav>

        <div className="flex items-center gap-1">
          <CartButton />
        </div>
      </div>
    </header>
  );
}
