"use client";

import { useState } from "react";
import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/constants";

// Contact page is a client component only because of the form state.
// Metadata is exported as a const and works with client pages in Next.js 13+.

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

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
        {label}
        {required && <span className="ml-0.5 text-coral">*</span>}
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
    <Container className="py-16 sm:py-24">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Contact" },
        ]}
      />

      <div className="mx-auto mt-10 grid max-w-4xl gap-16 lg:grid-cols-[1fr_2fr]">
        {/* ── Sidebar ── */}
        <aside className="space-y-8 text-sm text-text/70">
          <div className="space-y-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
              Support
            </p>
            <a
              href="mailto:support@r1pfitness.com"
              className="block text-text underline-offset-4 hover:underline hover:text-gold"
            >
              support@r1pfitness.com
            </a>
            <p className="text-xs">Response within 1 business day.</p>
          </div>

          <div className="space-y-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
              Mailing Address
            </p>
            <address className="not-italic leading-relaxed">
              {SITE.legalName}
              <br />
              {SITE.address.street}
              <br />
              {SITE.address.city}, {SITE.address.region} {SITE.address.postalCode}
            </address>
          </div>

          <div className="space-y-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
              Instagram
            </p>
            <a
              href={SITE.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-text underline-offset-4 hover:underline hover:text-gold"
            >
              @r1pfitness
            </a>
          </div>
        </aside>

        {/* ── Form ── */}
        <div>
          {status === "success" ? (
            <div className="space-y-4 border border-border p-8">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-gold">
                Message sent ✓
              </p>
              <p className="font-serif text-2xl text-text">We&apos;ll be in touch.</p>
              <p className="text-sm text-text/70">
                Expect a reply within 1 business day. Check your spam folder if you don&apos;t hear
                back.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              <div className="grid gap-6 sm:grid-cols-2">
                <Field label="Name" required>
                  <input
                    name="name"
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="Your name"
                    className="input w-full"
                  />
                </Field>
                <Field label="Email" required>
                  <input
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="your@email.com"
                    className="input w-full"
                  />
                </Field>
              </div>

              <Field label="Subject" required>
                <select name="subject" required className="input w-full">
                  <option value="">Select a subject…</option>
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Message" required>
                <textarea
                  name="message"
                  required
                  rows={6}
                  placeholder="Tell us what's on your mind…"
                  className="input w-full resize-none"
                />
              </Field>

              {error && (
                <p role="alert" className="text-sm text-coral">
                  {error}
                </p>
              )}

              <Button type="submit" loading={status === "loading"} className="w-full sm:w-auto">
                Send Message
              </Button>
            </form>
          )}
        </div>
      </div>
    </Container>
  );
}
