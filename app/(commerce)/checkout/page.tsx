import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Secure checkout — R1P FITNESS",
  robots: { index: false, follow: false },
};

/**
 * /checkout
 *
 * Two-step page:
 *  1. Address step (controlled form, submits to POST /api/checkout).
 *  2. Payment step (Stripe Elements, shown after API returns clientSecret).
 *
 * Layout (>=lg): two columns — form on left, "what you're getting" notice on
 * right. OrderSummary needs the Zustand cart so it must also be client-side;
 * we keep the right column purely informational here and let <CheckoutForm>
 * own all the cart reads.
 *
 * Cart-empty guard: handled client-side inside <CheckoutForm> via useCartItems.
 */
export default function CheckoutPage() {
  return (
    <Container size="lg" as="main" className="py-10 sm:py-16">
      <header className="mb-8 sm:mb-10">
        <Link
          href={ROUTES.cart}
          className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted hover:text-text"
          aria-label="Back to cart"
        >
          &larr; Cart
        </Link>
        <Heading level={1} size="xl" className="mt-3 text-3xl sm:text-4xl lg:text-5xl">
          Checkout
        </Heading>
        <p className="mt-2 font-mono text-xs uppercase tracking-[0.2em] text-muted">
          Secure &middot; SSL encrypted &middot; Powered by Stripe
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-16">
        {/* Main form */}
        <div>
          <CheckoutForm />
        </div>

        {/* Right rail — static trust signals; dynamic summary lives inside CheckoutForm */}
        <aside className="hidden lg:block">
          <div className="border border-border p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
              Why R1P?
            </p>
            <ul className="mt-4 space-y-3">
              {[
                "Limited drops — every piece is numbered",
                "Heavyweight 400gsm fabric",
                "Printed & shipped from Waipahu, HI",
                "30-day fit guarantee",
              ].map((point) => (
                <li key={point} className="flex items-start gap-2">
                  <span className="mt-px font-mono text-xs text-accent" aria-hidden>
                    /
                  </span>
                  <span className="font-sans text-sm text-muted">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 border border-border p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
              Questions?
            </p>
            <p className="mt-2 font-sans text-sm text-muted">
              DM us on{" "}
              <a
                href="https://instagram.com/r1pfitness"
                target="_blank"
                rel="noopener noreferrer"
                className="text-text underline underline-offset-2 hover:no-underline"
              >
                @r1pfitness
              </a>{" "}
              — we reply same day.
            </p>
          </div>
        </aside>
      </div>
    </Container>
  );
}
