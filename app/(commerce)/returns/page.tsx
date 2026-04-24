import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Container } from "@/components/ui/container";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Returns & Refunds — ${SITE.name}`,
  description: "Our return and refund policy for R1P FITNESS orders.",
  alternates: { canonical: "/returns" },
};

export default function ReturnsPage() {
  return (
    <Container className="py-16 sm:py-24">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Returns & Refunds" },
        ]}
      />

      <div className="mx-auto mt-10 max-w-2xl space-y-10 font-sans text-sm leading-relaxed text-text/80">
        <header className="space-y-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
            Last updated: April 2026
          </p>
          <h1 className="font-serif text-4xl text-text">Returns &amp; Refunds</h1>
          <p>
            Because every {SITE.name} drop is strictly limited and never restocked, we operate a
            limited returns window. Please read this policy before purchasing.
          </p>
        </header>

        <Section title="Return Window">
          <p>
            We accept returns within <strong className="text-text">14 days</strong> of delivery
            for items that are:
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>Unworn, unwashed, and in original condition with all tags attached.</li>
            <li>In original packaging.</li>
            <li>Free from odours, stains, or pet hair.</li>
          </ul>
          <p className="mt-3">
            Items that do not meet the above criteria will be returned to you at your cost.
          </p>
        </Section>

        <Section title="Non-Returnable Items">
          <ul className="list-disc space-y-1 pl-5">
            <li>Final sale or marked-down items.</li>
            <li>Gift cards.</li>
            <li>Items showing signs of wear.</li>
          </ul>
        </Section>

        <Section title="Exchanges">
          <p>
            Due to our limited-edition model, we cannot guarantee stock for exchanges. If you need
            a different size and stock remains available, we will do our best to accommodate you —
            but we recommend placing a new order immediately and initiating a return for the
            original item.
          </p>
        </Section>

        <Section title="How to Start a Return">
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              Email{" "}
              <a href="mailto:returns@r1pfitness.com" className="underline hover:text-gold">
                returns@r1pfitness.com
              </a>{" "}
              with your order number and the items you wish to return.
            </li>
            <li>We will reply within 1–2 business days with a return authorisation number (RAN).</li>
            <li>
              Ship the item(s) back using a trackable carrier. Return shipping costs are the
              customer&apos;s responsibility unless the item was defective or incorrectly shipped.
            </li>
            <li>
              Once we receive and inspect the return, we will process your refund within 5–7
              business days.
            </li>
          </ol>
        </Section>

        <Section title="Refunds">
          <p>
            Approved refunds are issued to your original payment method. Stripe typically
            processes refunds within 5–10 business days, depending on your bank.
          </p>
          <p className="mt-2">
            Original shipping costs are non-refundable unless the return is due to our error
            (wrong item shipped, manufacturing defect).
          </p>
        </Section>

        <Section title="Defective or Wrong Items">
          <p>
            If you received a defective item or the wrong product, email us within 7 days of
            delivery at{" "}
            <a href="mailto:support@r1pfitness.com" className="underline hover:text-gold">
              support@r1pfitness.com
            </a>{" "}
            with photos. We will cover return shipping and send a replacement or full refund at
            your choice.
          </p>
        </Section>

        <Section title="Questions?">
          <p>
            Contact us at{" "}
            <a href="mailto:support@r1pfitness.com" className="underline hover:text-gold">
              support@r1pfitness.com
            </a>
            . We typically respond within 1 business day.
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
