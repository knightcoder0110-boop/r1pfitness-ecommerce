"use client";

import { useState } from "react";
import {
  AtSign,
  ArrowUpRight,
  Clock3,
  Mail,
  MapPin,
  MessageSquareMore,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/constants";

const SUBJECTS = [
  "Order question",
  "Shipping question",
  "Returns & refunds",
  "Product / sizing",
  "Wholesale / collab inquiry",
  "Press / media",
  "Other",
] as const;

type Status = "idle" | "loading" | "success" | "error";

const INPUT_CLASS_NAME =
  "min-h-13 w-full border border-border bg-bg/75 px-4 py-3 font-sans text-base text-text placeholder:text-faint outline-none transition-[border-color,background-color,box-shadow] duration-200 focus:border-gold/50 focus:bg-bg focus:ring-1 focus:ring-gold/30";

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="flex flex-wrap items-center gap-2">
        <span className="text-muted font-mono text-[10px] tracking-[0.32em] uppercase">
          {label}
          {required && <span className="text-coral ml-0.5">*</span>}
        </span>
        {hint ? <span className="text-subtle text-xs">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

export default function ContactPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "loading" || status === "success") return;
    setStatus("loading");
    setError(null);

    const fd = new FormData(e.currentTarget);
    const payload = {
      name: fd.get("name") as string,
      email: fd.get("email") as string,
      subject: fd.get("subject") as string,
      message: fd.get("message") as string,
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setStatus("success");
      } else {
        setError(data.error?.message ?? "Something went wrong. Please try again.");
        setStatus("error");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
      setStatus("error");
    }
  }

  return (
    <Container className="py-14 sm:py-20">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Contact" }]} />

      <section className="mx-auto mt-8 max-w-6xl">
        <div className="grid gap-6 border border-border bg-[radial-gradient(circle_at_top_left,rgba(201,168,76,0.16),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0))] p-6 sm:gap-8 sm:p-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:p-10">
          <div className="flex flex-col gap-6 sm:gap-8">
            <div className="space-y-4">
              <p className="text-gold font-mono text-[10px] tracking-[0.42em] uppercase">
                Contact R1P
              </p>
              <h1 className="font-display text-4xl leading-none tracking-[0.04em] text-text sm:text-5xl lg:text-6xl">
                Reach the team without digging through tiny forms.
              </h1>
              <p className="max-w-xl text-base leading-7 text-muted sm:text-lg">
                Order help, shipping questions, sizing guidance, press requests, or wholesale
                inquiries. Use the form for anything detailed, or go straight to the right inbox.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <a
                href={`mailto:${SITE.emails.support}`}
                className="group border border-border bg-bg/55 p-5 transition-[border-color,transform,background-color] duration-200 hover:-translate-y-0.5 hover:border-gold/40 hover:bg-bg/80"
              >
                <div className="flex items-start justify-between gap-4">
                  <Mail className="text-gold size-5" aria-hidden />
                  <ArrowUpRight className="text-subtle size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
                </div>
                <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
                  Admin &amp; Support
                </p>
                <p className="mt-2 break-all text-lg text-text sm:text-xl">{SITE.emails.support}</p>
                <p className="mt-3 text-sm leading-6 text-muted">
                  Best for orders, sizing, returns, payment questions, and general customer support.
                </p>
              </a>

              <a
                href={`mailto:${SITE.emails.press}`}
                className="group border border-border bg-bg/55 p-5 transition-[border-color,transform,background-color] duration-200 hover:-translate-y-0.5 hover:border-gold/40 hover:bg-bg/80"
              >
                <div className="flex items-start justify-between gap-4">
                  <MessageSquareMore className="text-gold size-5" aria-hidden />
                  <ArrowUpRight className="text-subtle size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
                </div>
                <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
                  Press / Media
                </p>
                <p className="mt-2 break-all text-lg text-text sm:text-xl">{SITE.emails.press}</p>
                <p className="mt-3 text-sm leading-6 text-muted">
                  For PR, partnerships, creator collaborations, interviews, and media requests.
                </p>
              </a>
            </div>

            <div className="grid gap-4 sm:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
              <div className="border border-border bg-bg/45 p-5 sm:p-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-muted">
                  Response Window
                </p>
                <div className="mt-4 flex items-start gap-3">
                  <Clock3 className="text-gold mt-0.5 size-5 shrink-0" aria-hidden />
                  <div className="space-y-2">
                    <p className="text-xl text-text sm:text-2xl">Usually within 1 business day.</p>
                    <p className="text-sm leading-6 text-muted">
                      If your issue is order-sensitive, include your order number and any photos in
                      the first message so we can move faster.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border border-border bg-bg/45 p-5 sm:p-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-muted">
                  Find Us
                </p>
                <div className="mt-4 space-y-4 text-sm leading-6 text-muted">
                  <div className="flex items-start gap-3">
                    <MapPin className="text-gold mt-0.5 size-5 shrink-0" aria-hidden />
                    <address className="not-italic">
                      {SITE.legalName}
                      <br />
                      {SITE.address.street}
                      <br />
                      {SITE.address.city}, {SITE.address.region} {SITE.address.postalCode}
                    </address>
                  </div>
                  <a
                    href={SITE.social.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-text transition-colors hover:text-gold"
                  >
                    <AtSign className="text-gold size-5" aria-hidden />
                    <span>@r1pfitness</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="border border-border bg-bg/72 p-5 sm:p-7 lg:p-8">
            <div className="mb-6 space-y-3 border-b border-border pb-5 sm:mb-8 sm:pb-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.34em] text-muted">
                Send a message
              </p>
              <h2 className="font-display text-3xl tracking-[0.04em] text-text sm:text-4xl">
                Tell us what you need.
              </h2>
              <p className="text-sm leading-6 text-muted sm:text-base">
                The more detail you include, the faster we can solve it. For order questions,
                include the email used at checkout and your order number if you have it.
              </p>
            </div>

          {status === "success" ? (
            <div className="space-y-5 border border-border bg-[linear-gradient(180deg,rgba(201,168,76,0.12),rgba(201,168,76,0.04))] p-6 sm:p-8">
              <p className="text-gold font-mono text-[10px] tracking-[0.34em] uppercase">
                Message sent ✓
              </p>
              <p className="font-display text-3xl tracking-[0.04em] text-text sm:text-4xl">
                We&apos;ll be in touch.
              </p>
              <p className="max-w-lg text-base leading-7 text-muted">
                Expect a reply within 1 business day. Check your spam folder if you do not hear
                back, especially if you used a business or school email address.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-7" noValidate>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Name" required>
                  <input
                    name="name"
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="Your name"
                    className={INPUT_CLASS_NAME}
                  />
                </Field>
                <Field label="Email" required>
                  <input
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="your@email.com"
                    className={INPUT_CLASS_NAME}
                  />
                </Field>
              </div>

              <Field label="Subject" required hint="Choose the closest reason">
                <select name="subject" required className={INPUT_CLASS_NAME}>
                  <option value="">Select a subject…</option>
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Message" required hint="Include any order number, size, or product name">
                <textarea
                  name="message"
                  required
                  rows={7}
                  placeholder="Tell us what's on your mind…"
                  className={`${INPUT_CLASS_NAME} min-h-44 resize-y`}
                />
              </Field>

              {error && (
                <p role="alert" className="border border-coral/40 bg-coral/8 px-4 py-3 text-sm text-coral">
                  {error}
                </p>
              )}

              <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between sm:pt-6">
                <p className="text-sm leading-6 text-muted">
                  By sending a message you agree that we may reply by email regarding your order or
                  inquiry.
                </p>
                <Button
                  type="submit"
                  loading={status === "loading"}
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  Send Message
                </Button>
              </div>
            </form>
          )}
        </div>
        </div>
      </section>
    </Container>
  );
}
