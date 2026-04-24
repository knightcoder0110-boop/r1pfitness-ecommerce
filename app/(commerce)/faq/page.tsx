import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Container } from "@/components/ui/container";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: `FAQ — ${SITE.name}`,
  description: "Frequently asked questions about R1P FITNESS drops, orders, shipping, and sizing.",
  alternates: { canonical: "/faq" },
};

const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: "What is a 'drop'?",
    a: "A drop is a limited-edition product release available for 24 hours only. Once the window closes, those products are gone permanently — no restocks, ever.",
  },
  {
    q: "How do I know when the next drop is?",
    a: (
      <>
        The best way is to join our email list via the newsletter form on the homepage. We announce
        drops 24–48 hours in advance exclusively to subscribers.
      </>
    ),
  },
  {
    q: "Will sold-out items be restocked?",
    a: "No. Every R1P drop is permanent and final. That's not a marketing gimmick — it's core to what we are.",
  },
  {
    q: "What sizes do you carry?",
    a: "Most items are offered in S, M, L, XL, and 2XL. Check the size guide on each product page — fit may vary by style.",
  },
  {
    q: "How long does shipping take?",
    a: (
      <>
        Domestic orders typically arrive in 5–8 business days via standard shipping. See our{" "}
        <a href="/shipping" className="underline hover:text-gold">
          Shipping Policy
        </a>{" "}
        for all options including international.
      </>
    ),
  },
  {
    q: "Do you ship internationally?",
    a: "Yes! We ship to most countries worldwide. International orders may incur customs duties — see our Shipping Policy for details.",
  },
  {
    q: "Can I change or cancel my order?",
    a: "We process orders quickly. If you need to change or cancel, email support@r1pfitness.com immediately after placing your order. We cannot guarantee changes once an order has been processed.",
  },
  {
    q: "What is your return policy?",
    a: (
      <>
        We accept unworn, unwashed returns within 14 days of delivery. See our{" "}
        <a href="/returns" className="underline hover:text-gold">
          Returns Policy
        </a>{" "}
        for full details.
      </>
    ),
  },
  {
    q: "My order arrived damaged — what do I do?",
    a: "Email support@r1pfitness.com within 7 days with your order number and photos of the damage. We'll make it right.",
  },
  {
    q: "Do you have a physical store?",
    a: "We're an online-only brand. We occasionally pop up at local Hawaii events — follow us on Instagram @r1pfitness to stay in the loop.",
  },
  {
    q: "How do I create an account?",
    a: (
      <>
        Visit{" "}
        <a href="/account/register" className="underline hover:text-gold">
          /account/register
        </a>{" "}
        to create an account. An account lets you track orders, save addresses, and get early drop
        access.
      </>
    ),
  },
  {
    q: "I forgot my password — what now?",
    a: (
      <>
        Use the{" "}
        <a href="/account/forgot-password" className="underline hover:text-gold">
          Forgot Password
        </a>{" "}
        page to reset it via your email address.
      </>
    ),
  },
  {
    q: "Is my payment information secure?",
    a: "Yes. All payments are processed by Stripe, a PCI-DSS Level 1 certified payment processor. We never store your card details on our servers.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit and debit cards (Visa, Mastercard, American Express, Discover) via Stripe.",
  },
];

export default function FaqPage() {
  return (
    <Container className="py-16 sm:py-24">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "FAQ" },
        ]}
      />

      <div className="mx-auto mt-10 max-w-2xl">
        <header className="mb-12 space-y-3">
          <h1 className="font-serif text-4xl text-text">Frequently Asked Questions</h1>
          <p className="text-sm text-text/70">
            Can&apos;t find your answer?{" "}
            <a href="/contact" className="underline hover:text-gold">
              Contact us
            </a>
            .
          </p>
        </header>

        <div className="divide-y divide-border">
          {FAQS.map(({ q, a }) => (
            <details key={q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 font-serif text-base text-text">
                <span>{q}</span>
                <span className="mt-0.5 shrink-0 font-mono text-lg text-muted transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-4 text-sm leading-relaxed text-text/70">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </Container>
  );
}
