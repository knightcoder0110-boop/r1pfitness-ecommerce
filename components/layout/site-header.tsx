import Link from "next/link";
import { CartButton } from "@/components/cart/cart-button";
import { Container } from "@/components/ui/container";
import { ROUTES, SITE } from "@/lib/constants";
import { MobileNav, type NavLinkItem } from "./mobile-nav";
import { AccountButton } from "./account-button";

/**
 * Primary nav links. Declared once — both desktop nav and `<MobileNav />`
 * consume the same list so there's no drift.
 */
const NAV_LINKS: NavLinkItem[] = [
  { label: "Shop",    href: ROUTES.shop },
  { label: "Tees",    href: ROUTES.category("tees") },
  { label: "Hoodies", href: ROUTES.category("hoodies") },
];

/**
 * Persistent site header. Server component — client behaviour is isolated
 * to `<CartButton />` and `<MobileNav />` at their own boundaries.
 */
export function SiteHeader() {
  return (
    <header
      className="sticky top-0 z-[40] w-full border-b border-border bg-bg/80 backdrop-blur-md"
      style={{ height: "var(--size-header)" }}
    >
      <Container className="flex h-full items-center justify-between gap-4">
        {/* Left: mobile menu + logo */}
        <div className="flex items-center gap-2">
          <MobileNav links={NAV_LINKS} />
          <Link
            href={ROUTES.home}
            aria-label={`${SITE.name} home`}
            className="font-display text-lg sm:text-xl tracking-[0.25em] text-text transition-opacity hover:opacity-80"
          >
            {SITE.name}
          </Link>
        </div>

        {/* Desktop nav */}
        <nav aria-label="Primary" className="hidden sm:block">
          <ul className="flex items-center gap-6 md:gap-8 font-mono text-xs uppercase tracking-[0.25em] text-muted">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="transition-colors hover:text-text focus-visible:text-text"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Right: account + cart */}
        <div className="flex items-center gap-3">
          <AccountButton />
          <CartButton />
        </div>
      </Container>
    </header>
  );
}
