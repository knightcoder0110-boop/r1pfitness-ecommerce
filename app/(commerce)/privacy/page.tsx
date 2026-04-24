import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Container } from "@/components/ui/container";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Privacy Policy — ${SITE.name}`,
  description: "How R1P FITNESS collects, uses, and protects your personal information.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <Container className="py-16 sm:py-24">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Privacy Policy" },
        ]}
      />

      <div className="mx-auto mt-10 max-w-2xl space-y-10 font-sans text-sm leading-relaxed text-text/80">
        <header className="space-y-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
            Last updated: April 2026
          </p>
          <h1 className="font-serif text-4xl text-text">Privacy Policy</h1>
          <p>
            R1P FITNESS (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) operates
            this website. This policy explains what information we collect, how we use it, and your
            rights.
          </p>
        </header>

        <Section title="1. Information We Collect">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="text-text">Order information</strong> — name, email, shipping
              address, and payment details when you place an order. Payment card data is handled
              entirely by Stripe and never stored on our servers.
            </li>
            <li>
              <strong className="text-text">Account information</strong> — email and password hash
              if you create an account.
            </li>
            <li>
              <strong className="text-text">Newsletter subscription</strong> — email address if you
              opt in.
            </li>
            <li>
              <strong className="text-text">Usage data</strong> — pages visited, browser type, and
              referring URL collected via Google Tag Manager / GA4 (anonymised IP).
            </li>
            <li>
              <strong className="text-text">Cookies</strong> — session, cart, and site-unlock
              cookies (all httpOnly; no third-party tracking cookies beyond GTM).
            </li>
          </ul>
        </Section>

        <Section title="2. How We Use Your Information">
          <ul className="list-disc space-y-2 pl-5">
            <li>Fulfil and ship your order.</li>
            <li>Send order confirmation and shipping notification emails.</li>
            <li>
              Send marketing emails if you opted in (you can unsubscribe at any time via the link
              in each email).
            </li>
            <li>Improve the site using aggregate analytics.</li>
            <li>Detect and prevent fraud.</li>
          </ul>
        </Section>

        <Section title="3. Sharing Your Information">
          <p>
            We do not sell your personal data. We share it only with the service providers who
            help us run the business:
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>
              <strong className="text-text">Stripe</strong> — payment processing (
              <a
                href="https://stripe.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-gold"
              >
                Stripe Privacy Policy
              </a>
              ).
            </li>
            <li>
              <strong className="text-text">Klaviyo</strong> — email marketing (
              <a
                href="https://www.klaviyo.com/legal/privacy-notice"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-gold"
              >
                Klaviyo Privacy Policy
              </a>
              ).
            </li>
            <li>
              <strong className="text-text">WooCommerce / WordPress</strong> — order management
              (self-hosted on Cloudways).
            </li>
            <li>
              <strong className="text-text">Google Analytics 4</strong> — anonymised site
              analytics.
            </li>
          </ul>
        </Section>

        <Section title="4. Data Retention">
          <p>
            Order records are retained for 7 years for tax/accounting purposes. Marketing consent
            records are retained until you withdraw consent. You can request deletion of all other
            personal data by contacting us.
          </p>
        </Section>

        <Section title="5. Your Rights">
          <p>
            Depending on your location, you may have rights to access, correct, delete, or port
            your personal data, and to object to processing. Email us at{" "}
            <a href="mailto:privacy@r1pfitness.com" className="underline hover:text-gold">
              privacy@r1pfitness.com
            </a>{" "}
            to exercise any of these rights.
          </p>
        </Section>

        <Section title="6. Cookies">
          <p>
            We use essential cookies (cart session, site unlock) required for the site to function,
            and analytics cookies via Google Tag Manager. You can disable non-essential cookies in
            your browser settings at any time.
          </p>
        </Section>

        <Section title="7. Changes">
          <p>
            We may update this policy from time to time. Material changes will be announced via
            email to account holders. Continued use of the site after changes constitutes
            acceptance.
          </p>
        </Section>

        <Section title="8. Contact">
          <p>
            Questions? Email{" "}
            <a href="mailto:privacy@r1pfitness.com" className="underline hover:text-gold">
              privacy@r1pfitness.com
            </a>{" "}
            or write to {SITE.address.street}, {SITE.address.city}, {SITE.address.region}{" "}
            {SITE.address.postalCode}.
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
