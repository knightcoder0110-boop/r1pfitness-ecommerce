import Link from "next/link";
import { Container } from "@/components/ui/container";
import { ROUTES, SITE } from "@/lib/constants";
import { NewsletterForm } from "@/components/marketing/newsletter-form";

/* ─── Nav columns ───────────────────────────────────────────────────────── */
const SHOP_LINKS = [
  { label: "All Products", href: ROUTES.shop },
  { label: "Tees", href: "/shop?category=tees" },
  { label: "Hoodies", href: "/shop?category=hoodies" },
  { label: "Bottoms", href: "/shop?category=bottoms" },
  { label: "Caps", href: "/shop?category=caps" },
  { label: "Activewear", href: "/shop?category=activewear" },
  { label: "Accessories", href: "/shop?category=accessories" },
];

const INFO_LINKS = [
  { label: "About R1P", href: "#" },
  { label: "Our Story", href: "#" },
  { label: "Shipping & Returns", href: "#" },
  { label: "Sizing Guide", href: "#" },
  { label: "FAQ", href: "#" },
  { label: "Contact", href: "#" },
];

/* ─── Instagram icon ─────────────────────────────────────────────────────── */
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true" className={className}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

/* ─── Newsletter row — uses the live Klaviyo client form ─────────────────── */
function NewsletterRow() {
  return (
    <div className="border-t border-border pt-10 mt-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-gold mb-2">
            Stay in the loop
          </p>
          <h3 className="font-display text-2xl sm:text-3xl leading-none tracking-widest text-text">
            JOIN THE OHANA
          </h3>
          <p className="text-subtle text-sm mt-2 max-w-xs">
            Limited drops, exclusive early access, and Waipahu culture — direct to your inbox.
          </p>
        </div>
        <NewsletterForm
          buttonLabel="Subscribe"
          placeholder="your@email.com"
          size="full"
        />
      </div>
    </div>
  );
}

/* ─── Main footer ────────────────────────────────────────────────────────── */

/**
 * Full-width site footer.
 *
 * Layout:
 *   Row 1 — Brand column + Shop column + Info column + Connect column
 *   Row 2 — Newsletter signup (full width)
 *   Row 3 — Legal bar (© + address + links)
 *
 * Note: NewsletterRow uses a minimal form; Klaviyo integration deferred.
 */
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface-1 pt-16 pb-8">
      <Container>
        {/* ── Column grid ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-4 lg:grid-cols-4 mb-2">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-4 lg:col-span-1 flex flex-col gap-4">
            <Link
              href="/"
              className="font-display text-3xl tracking-[0.15em] text-text hover:text-gold transition-colors leading-none"
              aria-label={SITE.name}
            >
              {SITE.name}
            </Link>
            <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-gold">
              {SITE.tagline}
            </p>
            <p className="text-subtle text-sm leading-relaxed max-w-xs">
              Hawaiian streetwear & fitness apparel. Designed and dropped from Waipahu, HI.
            </p>
            <a
              href={SITE.social.instagram}
              target="_blank"
              rel="noreferrer"
              aria-label="Follow R1P FITNESS on Instagram"
              className="inline-flex items-center gap-2 text-muted hover:text-gold transition-colors text-xs font-mono uppercase tracking-widest mt-auto"
            >
              <InstagramIcon className="size-5" />
              @r1pfitness
            </a>
          </div>

          {/* Shop */}
          <div className="flex flex-col gap-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-gold">
              Shop
            </p>
            <ul className="flex flex-col gap-2.5" role="list">
              {SHOP_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="font-mono text-[10px] uppercase tracking-[0.2em] text-subtle hover:text-text transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div className="flex flex-col gap-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-gold">
              Info
            </p>
            <ul className="flex flex-col gap-2.5" role="list">
              {INFO_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="font-mono text-[10px] uppercase tracking-[0.2em] text-subtle hover:text-text transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div className="flex flex-col gap-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-gold">
              Connect
            </p>
            <ul className="flex flex-col gap-2.5" role="list">
              <li>
                <a
                  href={SITE.social.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[10px] uppercase tracking-[0.2em] text-subtle hover:text-text transition-colors"
                >
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href="mailto:r1pfitness@gmail.com"
                  className="font-mono text-[10px] uppercase tracking-[0.2em] text-subtle hover:text-text transition-colors"
                >
                  Email Us
                </a>
              </li>
            </ul>
            <div className="mt-4 flex flex-col gap-1">
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted">
                Location
              </p>
              <address className="not-italic font-mono text-[9px] uppercase tracking-[0.2em] text-subtle leading-relaxed">
                {SITE.address.street}<br />
                {SITE.address.city}, {SITE.address.region} {SITE.address.postalCode}
              </address>
            </div>
          </div>
        </div>

        {/* ── Newsletter ──────────────────────────────────────────────── */}
        <NewsletterRow />

        {/* ── Legal bar ───────────────────────────────────────────────── */}
        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-faint">
            © {year} {SITE.legalName}. All rights reserved.
          </p>
          <nav aria-label="Legal links">
            <ul className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-[9px] uppercase tracking-[0.2em] text-faint" role="list">
              <li>
                <Link href="#" className="hover:text-subtle transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-subtle transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-subtle transition-colors">
                  Refund Policy
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </Container>
    </footer>
  );
}
