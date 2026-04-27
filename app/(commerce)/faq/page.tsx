import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock3, Mail } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Container } from "@/components/ui/container";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "FAQ",
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
        <a href="/shipping" className="hover:text-gold underline">
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
    a: `We process orders quickly. If you need to change or cancel, email ${SITE.emails.support} immediately after placing your order. We cannot guarantee changes once an order has been processed.`,
  },
  {
    q: "What is your return policy?",
    a: (
      <>
        We accept unworn, unwashed returns within 14 days of delivery. See our{" "}
        <a href="/returns" className="hover:text-gold underline">
          Returns Policy
        </a>{" "}
        for full details.
      </>
    ),
  },
  {
    q: "My order arrived damaged — what do I do?",
    a: `Email ${SITE.emails.support} within 7 days with your order number and photos of the damage. We'll make it right.`,
  },
  {
    q: "Do you have a physical store?",
    a: "We're an online-only brand. We occasionally pop up at local Hawaii events — follow us on Instagram @r1pfitness to stay in the loop.",
  },
  {
    q: "How do I create an account?",
    a: (
      <>
        Customer account creation is currently unavailable. If that changes later, we&apos;ll add it
        back to the site.
      </>
    ),
  },
  {
    q: "I forgot my password — what now?",
    a: (
      <>
        Use the{" "}
        <a href="/account/forgot-password" className="hover:text-gold underline">
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
    <Container className="py-14 sm:py-20">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "FAQ" }]} />

      <div className="mx-auto mt-8 max-w-5xl space-y-8 sm:space-y-10">
        <header className="grid gap-6 border border-border bg-[radial-gradient(circle_at_top_left,rgba(201,168,76,0.14),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0))] p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end lg:p-10">
          <div className="space-y-4">
            <p className="text-gold font-mono text-[10px] tracking-[0.42em] uppercase">
              Support Library
            </p>
            <h1 className="font-display text-4xl leading-none tracking-[0.04em] text-text sm:text-5xl lg:text-6xl">
              Clear answers, in readable type.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted sm:text-lg">
              Everything customers ask most often about drops, shipping, sizing, payments, and
              returns. If your answer is not here, reach out directly and we&apos;ll handle it.
            </p>
          </div>

          <div className="grid gap-4">
            <div className="border border-border bg-bg/55 p-5">
              <div className="flex items-start gap-3">
                <Clock3 className="text-gold mt-0.5 size-5 shrink-0" aria-hidden />
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
                    Typical reply
                  </p>
                  <p className="mt-2 text-lg text-text">Within 1 business day</p>
                </div>
              </div>
            </div>
            <Link
              href="/contact"
              className="group border border-border bg-bg/55 p-5 transition-[border-color,transform,background-color] duration-200 hover:-translate-y-0.5 hover:border-gold/40 hover:bg-bg/80"
            >
              <div className="flex items-start gap-3">
                <Mail className="text-gold mt-0.5 size-5 shrink-0" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
                    Still need help?
                  </p>
                  <p className="mt-2 break-all text-base text-text">{SITE.emails.support}</p>
                </div>
                <ArrowRight className="text-subtle size-4 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </div>
            </Link>
          </div>
        </header>

        <div className="space-y-3 sm:space-y-4">
          {FAQS.map(({ q, a }) => (
            <details
              key={q}
              className="group border border-border bg-bg/45 px-5 py-5 transition-colors duration-200 open:bg-bg/70 sm:px-7 sm:py-6"
            >
              <summary className="text-text flex cursor-pointer list-none items-start justify-between gap-6 font-display text-xl leading-8 tracking-[0.03em] sm:text-2xl">
                <span className="max-w-3xl">{q}</span>
                <span className="text-muted mt-0.5 shrink-0 font-mono text-2xl transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <div className="mt-4 border-t border-border pt-4 sm:mt-5 sm:pt-5">
                <div className="max-w-3xl text-base leading-8 text-muted sm:text-lg [&_a]:underline [&_a]:underline-offset-4 [&_a]:transition-colors [&_a]:hover:text-gold">
                  {a}
                </div>
              </div>
            </details>
          ))}
        </div>
      </div>
    </Container>
  );
}
