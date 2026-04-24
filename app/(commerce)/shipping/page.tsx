import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Container } from "@/components/ui/container";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Shipping",
  description: "Shipping methods, transit times, and delivery information for R1P FITNESS orders.",
  alternates: { canonical: "/shipping" },
};

const DOMESTIC = [
  { method: "Standard (USPS Ground)", time: "5–8 business days", cost: "Free on orders $75+" },
  { method: "Standard (USPS Ground)", time: "5–8 business days", cost: "$6.99 under $75" },
  { method: "Priority (USPS Priority Mail)", time: "2–3 business days", cost: "$12.99" },
  { method: "Express (USPS Priority Express)", time: "1–2 business days", cost: "$24.99" },
] as const;

const INTERNATIONAL = [
  { region: "Canada", time: "7–14 business days", cost: "From $18.99" },
  { region: "Europe", time: "10–21 business days", cost: "From $24.99" },
  { region: "Australia / NZ", time: "10–21 business days", cost: "From $24.99" },
  { region: "Rest of world", time: "14–30 business days", cost: "From $29.99" },
] as const;

export default function ShippingPage() {
  return (
    <Container className="py-16 sm:py-24">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Shipping Policy" },
        ]}
      />

      <div className="mx-auto mt-10 max-w-2xl space-y-10 font-sans text-sm leading-relaxed text-text/80">
        <header className="space-y-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
            Last updated: April 2026
          </p>
          <h1 className="font-serif text-4xl text-text">Shipping Policy</h1>
          <p>
            We ship from Waipahu, Hawaii. Orders are processed Monday–Friday, excluding US federal
            holidays. Allow 1–2 business days for order processing before your shipment leaves
            our facility.
          </p>
        </header>

        <Section title="Domestic (United States)">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border font-mono text-[10px] uppercase tracking-[0.25em] text-muted">
                  <th className="pb-3 pr-6">Method</th>
                  <th className="pb-3 pr-6">Transit time</th>
                  <th className="pb-3">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {DOMESTIC.map((row) => (
                  <tr key={row.method + row.cost} className="py-3">
                    <td className="py-3 pr-6 text-text">{row.method}</td>
                    <td className="py-3 pr-6">{row.time}</td>
                    <td className="py-3">{row.cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4">
            Free standard shipping is automatically applied to orders totalling $75 or more before
            tax.
          </p>
        </Section>

        <Section title="International">
          <p>
            We ship to most countries worldwide. International orders may be subject to customs
            duties and import taxes charged by the destination country — these are the
            buyer&apos;s responsibility.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border font-mono text-[10px] uppercase tracking-[0.25em] text-muted">
                  <th className="pb-3 pr-6">Region</th>
                  <th className="pb-3 pr-6">Transit time</th>
                  <th className="pb-3">Starting from</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {INTERNATIONAL.map((row) => (
                  <tr key={row.region}>
                    <td className="py-3 pr-6 text-text">{row.region}</td>
                    <td className="py-3 pr-6">{row.time}</td>
                    <td className="py-3">{row.cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Tracking">
          <p>
            You will receive a shipping confirmation email with a tracking number once your order
            ships. Domestic orders can be tracked at{" "}
            <a
              href="https://tools.usps.com/go/TrackConfirmAction"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gold"
            >
              usps.com
            </a>
            .
          </p>
        </Section>

        <Section title="Lost or Damaged Packages">
          <p>
            If your package arrives damaged or is lost in transit, contact us within 14 days of
            the expected delivery date at{" "}
            <a href="mailto:support@r1pfitness.com" className="underline hover:text-gold">
              support@r1pfitness.com
            </a>{" "}
            and we will work with the carrier to resolve the issue.
          </p>
        </Section>

        <Section title="P.O. Boxes & APO/FPO">
          <p>
            We ship to P.O. Boxes and APO/FPO addresses via USPS Standard only. Express and
            Priority options are unavailable for these addresses.
          </p>
        </Section>

        <Section title="Questions?">
          <p>
            Email{" "}
            <a href="mailto:support@r1pfitness.com" className="underline hover:text-gold">
              support@r1pfitness.com
            </a>{" "}
            — we typically respond within 1 business day.
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
