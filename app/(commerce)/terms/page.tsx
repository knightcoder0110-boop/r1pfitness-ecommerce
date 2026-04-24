import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Container } from "@/components/ui/container";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Terms of Service — ${SITE.name}`,
  description: "The terms and conditions governing your use of the R1P FITNESS website and purchases.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <Container className="py-16 sm:py-24">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Terms of Service" },
        ]}
      />

      <div className="mx-auto mt-10 max-w-2xl space-y-10 font-sans text-sm leading-relaxed text-text/80">
        <header className="space-y-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
            Last updated: April 2026
          </p>
          <h1 className="font-serif text-4xl text-text">Terms of Service</h1>
          <p>
            By accessing or purchasing from {SITE.name} you agree to these Terms of Service.
            Please read them carefully.
          </p>
        </header>

        <Section title="1. General">
          <p>
            These terms apply to all visitors, users, and customers of r1pfitness.com. We reserve
            the right to update these terms at any time. Material changes will be communicated via
            email. Continued use constitutes acceptance.
          </p>
        </Section>

        <Section title="2. Products">
          <p>
            All products are subject to availability. We reserve the right to limit quantities.
            Descriptions and images are as accurate as possible; minor variations may exist due to
            photography and screen calibration.
          </p>
          <p className="mt-2">
            {SITE.name} operates an exclusive limited-drop model. Once a drop window closes,
            products are gone permanently — there are no restocks.
          </p>
        </Section>

        <Section title="3. Pricing & Payment">
          <p>
            All prices are in USD and include applicable taxes where required by law. We accept
            payment via major credit/debit cards through Stripe. Payment is charged at the time of
            order confirmation.
          </p>
          <p className="mt-2">
            We reserve the right to cancel any order placed at an incorrect price due to a system
            error, and will issue a full refund.
          </p>
        </Section>

        <Section title="4. Order Acceptance">
          <p>
            Receipt of an order confirmation email does not constitute our acceptance of an order.
            We reserve the right to refuse or cancel any order, including after confirmation, if we
            suspect fraud or if stock becomes unavailable.
          </p>
        </Section>

        <Section title="5. Shipping">
          <p>
            Shipping times are estimates only. We are not responsible for carrier delays. Risk of
            loss passes to you upon handoff to the carrier. See our{" "}
            <a href="/shipping" className="underline hover:text-gold">
              Shipping Policy
            </a>{" "}
            for full details.
          </p>
        </Section>

        <Section title="6. Returns & Refunds">
          <p>
            See our{" "}
            <a href="/returns" className="underline hover:text-gold">
              Returns Policy
            </a>{" "}
            for full details. Due to the limited-edition nature of our products, we cannot
            guarantee exchanges for the same item.
          </p>
        </Section>

        <Section title="7. Intellectual Property">
          <p>
            All content on this site — including logos, graphics, copy, and product photography —
            is the property of {SITE.legalName} and may not be reproduced without written
            permission.
          </p>
        </Section>

        <Section title="8. Limitation of Liability">
          <p>
            To the maximum extent permitted by law, {SITE.legalName} shall not be liable for any
            indirect, incidental, or consequential damages arising from your use of this site or
            purchase of our products.
          </p>
        </Section>

        <Section title="9. Governing Law">
          <p>
            These terms are governed by the laws of the State of Hawaii. Any disputes shall be
            resolved in the courts of Honolulu County, Hawaii.
          </p>
        </Section>

        <Section title="10. Contact">
          <p>
            Questions about these terms? Email{" "}
            <a href="mailto:legal@r1pfitness.com" className="underline hover:text-gold">
              legal@r1pfitness.com
            </a>
            .
          </p>
        </Section>
      </div>
    </Container>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-serif text-xl text-text">{title}</h2>
      {children}
    </section>
  );
}
