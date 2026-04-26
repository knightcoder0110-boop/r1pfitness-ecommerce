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
  { label: "About R1P", href: ROUTES.about },
  { label: "Our Story", href: ROUTES.about },
  { label: "All Collections", href: ROUTES.collections },
  { label: "FAQ", href: `${ROUTES.about}#faq` },
  { label: "Contact", href: "mailto:aloha@r1pfitness.com" },
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
    <div className="border-t border-border-strong pt-14 mt-14">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_minmax(0,28rem)] gap-10 md:gap-14 items-center">
        <div>
          <p
            className="font-mono uppercase text-gold mb-3"
            style={{
              fontSize:      "var(--footer-heading-size)",
              letterSpacing: "0.45em",
              fontWeight:    600,
            }}
          >
            Stay in the loop
          </p>
          <h3 className="font-display text-3xl sm:text-4xl leading-none tracking-[0.18em] text-text">
            JOIN THE OHANA
          </h3>
          <p className="font-serif text-[1.0625rem] text-muted mt-4 max-w-md leading-relaxed">
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
    <footer className="border-t border-border-strong bg-surface-1 pt-20 pb-10">
      <Container>
        {/* ── Column grid ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-14 sm:grid-cols-4 lg:grid-cols-4 mb-2">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-4 lg:col-span-1 flex flex-col gap-5">
            <Link
              href="/"
              className="font-display text-4xl tracking-[0.15em] text-text hover:text-gold cursor-pointer transition-colors leading-none"
              aria-label={SITE.name}
            >
              {SITE.name}
            </Link>
            <p
              className="font-mono uppercase text-gold"
              style={{
                fontSize:      "0.75rem",
                letterSpacing: "0.45em",
                fontWeight:    600,
              }}
            >
              {SITE.tagline}
            </p>
            <p className="font-serif text-base text-muted leading-relaxed max-w-xs">
              Hawaiian streetwear & fitness apparel. Designed and dropped from Waipahu, HI.
            </p>
            <a
              href={SITE.social.instagram}
              target="_blank"
              rel="noreferrer"
              aria-label="Follow R1P FITNESS on Instagram"
              className="inline-flex items-center gap-2.5 text-text hover:text-gold cursor-pointer transition-colors font-mono uppercase mt-auto"
              style={{
                fontSize:      "var(--footer-link-size)",
                letterSpacing: "0.2em",
                fontWeight:    500,
              }}
            >
              <InstagramIcon className="size-5" />
              @r1pfitness
            </a>
          </div>

          {/* Shop */}
          <div className="flex flex-col gap-5">
            <p
              className="font-mono uppercase text-gold"
              style={{
                fontSize:      "var(--footer-heading-size)",
                letterSpacing: "var(--footer-heading-tracking)",
                fontWeight:    600,
              }}
            >
              Shop
            </p>
            <ul className="flex flex-col gap-3" role="list">
              {SHOP_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="font-mono uppercase text-text/85 hover:text-gold cursor-pointer transition-colors"
                    style={{
                      fontSize:      "var(--footer-link-size)",
                      letterSpacing: "var(--footer-link-tracking)",
                      fontWeight:    500,
                    }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div className="flex flex-col gap-5">
            <p
              className="font-mono uppercase text-gold"
              style={{
                fontSize:      "var(--footer-heading-size)",
                letterSpacing: "var(--footer-heading-tracking)",
                fontWeight:    600,
              }}
            >
              Info
            </p>
            <ul className="flex flex-col gap-3" role="list">
              {INFO_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="font-mono uppercase text-text/85 hover:text-gold cursor-pointer transition-colors"
                    style={{
                      fontSize:      "var(--footer-link-size)",
                      letterSpacing: "var(--footer-link-tracking)",
                      fontWeight:    500,
                    }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div className="flex flex-col gap-5">
            <p
              className="font-mono uppercase text-gold"
              style={{
                fontSize:      "var(--footer-heading-size)",
                letterSpacing: "var(--footer-heading-tracking)",
                fontWeight:    600,
              }}
            >
              Connect
            </p>
            <ul className="flex flex-col gap-3" role="list">
              <li>
                <a
                  href={SITE.social.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono uppercase text-text/85 hover:text-gold cursor-pointer transition-colors"
                  style={{
                    fontSize:      "var(--footer-link-size)",
                    letterSpacing: "var(--footer-link-tracking)",
                    fontWeight:    500,
                  }}
                >
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href="mailto:r1pfitness@gmail.com"
                  className="font-mono uppercase text-text/85 hover:text-gold cursor-pointer transition-colors"
                  style={{
                    fontSize:      "var(--footer-link-size)",
                    letterSpacing: "var(--footer-link-tracking)",
                    fontWeight:    500,
                  }}
                >
                  Email Us
                </a>
              </li>
            </ul>
            <div className="mt-5 flex flex-col gap-2">
              <p
                className="font-mono uppercase text-gold"
                style={{
                  fontSize:      "0.6875rem",
                  letterSpacing: "0.3em",
                  fontWeight:    600,
                }}
              >
                Location
              </p>
              <address className="not-italic font-serif text-sm text-muted leading-relaxed">
                {SITE.address.street}<br />
                {SITE.address.city}, {SITE.address.region} {SITE.address.postalCode}
              </address>
            </div>
          </div>
        </div>

        {/* ── Newsletter ──────────────────────────────────────────────── */}
        <NewsletterRow />

        {/* ── Legal bar ───────────────────────────────────────────────── */}
        <div className="mt-12 pt-8 border-t border-border-strong flex flex-col sm:flex-row items-center justify-between gap-4">
          <p
            className="font-mono uppercase text-subtle"
            style={{
              fontSize:      "0.6875rem",
              letterSpacing: "0.25em",
            }}
          >
            © {year} {SITE.legalName}. All rights reserved.
          </p>
          <nav aria-label="Legal links">
            <ul
              className="flex flex-wrap gap-x-6 gap-y-1 font-mono uppercase"
              style={{
                fontSize:      "0.6875rem",
                letterSpacing: "0.25em",
              }}
              role="list"
            >
              <li>
                <Link href={ROUTES.privacy} className="text-subtle hover:text-gold cursor-pointer transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href={ROUTES.terms} className="text-subtle hover:text-gold cursor-pointer transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href={ROUTES.returns} className="text-subtle hover:text-gold cursor-pointer transition-colors">
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
