"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

/* ── Feature strip data ─────────────────────────────────────────── */
const FEATURES = [
  {
    title: "Early Access",
    desc: "Get first access to every limited drop.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden className="size-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5 13.5 3l-2.25 7.5h6L9 21l1.5-7.5h-6.75Z" />
      </svg>
    ),
  },
  {
    title: "Secret Releases",
    desc: "Exclusive products you won't find anywhere else.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden className="size-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m12 0H4.5a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 1.5 1.5h15a1.5 1.5 0 0 0 1.5-1.5V12a1.5 1.5 0 0 0-1.5-1.5Z" />
      </svg>
    ),
  },
  {
    title: "VIP Discounts",
    desc: "Special offers and discounts for members only.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden className="size-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0c1.1.128 1.907 1.077 1.907 2.185ZM9.75 9h.008v.008H9.75V9Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm4.125 4.5h.008v.008h-.008V13.5Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
      </svg>
    ),
  },
  {
    title: "Member Rewards",
    desc: "Earn points, unlock rewards and get surprise gifts.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden className="size-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
      </svg>
    ),
  },
  {
    title: "Ohana Forever",
    desc: "You're not a customer. You're family.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden className="size-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c-2 3-3 5-3 7a3 3 0 1 0 6 0c0-2-1-4-3-7Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 11c2 1 4 1 6 0M20 11c-2 1-4 1-6 0M6 8c2 0 3 1 4 3M18 8c-2 0-3 1-4 3M12 13v8M8 21h8" />
      </svg>
    ),
  },
];

/* ── Animation variants ─────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.08, ease: [0.2, 0.8, 0.2, 1] as [number, number, number, number] },
  }),
};

export default function SiteLockScreen() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || loading) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/site-unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        // Reload to the home page — the cookie is now set server-side
        window.location.href = "/";
      } else {
        setError("Wrong password. Join the Ohana to get it first.");
        setShake(true);
        setPassword("");
        setTimeout(() => setShake(false), 600);
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-bg overflow-x-clip">
      {/* ── Full-bleed background image ───────────────────────────── */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero/hero-cover-desktop-mode.png"
          alt=""
          aria-hidden
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />

        {/* Mobile: heavy dark overlay for legibility */}
        <div aria-hidden className="absolute inset-0 bg-bg/82 md:hidden" />

        {/* Desktop: left-to-right gradient — content on left, image bleeds right */}
        <div
          aria-hidden
          className="absolute inset-0 hidden md:block"
          style={{
            background:
              "linear-gradient(to right, rgba(13,13,13,0.97) 0%, rgba(13,13,13,0.82) 42%, rgba(13,13,13,0.55) 68%, rgba(13,13,13,0.20) 100%)",
          }}
        />

        {/* Top vignette — seamless with whatever header might be above */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-28 bg-linear-to-b from-bg to-transparent"
        />

        {/* Bottom vignette — fades into feature strip */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-48 bg-linear-to-t from-bg to-transparent"
        />
      </div>

      {/* ── Ohana badge watermark — top-right corner (desktop) ───── */}
      <div
        aria-hidden
        className="absolute top-8 right-8 z-10 hidden md:flex flex-col items-center justify-center size-24 rounded-full border border-gold/20 opacity-30"
        style={{
          background:
            "radial-gradient(circle at center, rgba(201,168,76,0.08) 0%, transparent 70%)",
        }}
      >
        <span className="font-display text-[9px] tracking-[0.25em] uppercase text-gold leading-tight text-center">
          Ohana
          <br />
          Forever
        </span>
        <span className="text-gold text-sm mt-0.5">🌴</span>
        <span className="font-display text-[7px] tracking-[0.3em] uppercase text-gold/70 leading-tight text-center mt-0.5">
          R1P Fitness
        </span>
      </div>

      {/* ── Main layout ──────────────────────────────────────────── */}
      <div className="relative z-10 flex min-h-screen flex-col">
        {/* ─ Center section — content ─────────────────────────── */}
        <div className="flex flex-1 items-center justify-center md:justify-start px-6 md:px-0 md:pl-[8%] xl:pl-[12%] py-10 md:py-20">
          <div className="w-full max-w-md">
            {/* Eyebrow */}
            <motion.div
              custom={0}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="flex items-center gap-3 mb-6"
            >
              <div className="h-px flex-1 bg-gold/40" />
              <p className="font-mono text-[11px] tracking-[0.32em] uppercase text-gold">
                Join the Ohana
              </p>
              <div className="h-px flex-1 bg-gold/40" />
            </motion.div>

            {/* Headline — matches reference: 3 stacked lines */}
            <motion.h1
              custom={1}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="font-display font-black uppercase leading-[0.88] tracking-tight mb-5"
            >
              <span className="block text-text" style={{ fontSize: "clamp(2rem, 7vw, 4.5rem)" }}>
                Early Access.
              </span>
              <span className="block text-text" style={{ fontSize: "clamp(2rem, 7vw, 4.5rem)" }}>
                Exclusive Drops.
              </span>
              <span
                className="block"
                style={{
                  fontSize: "clamp(2rem, 7vw, 4.5rem)",
                  color: "var(--brand-gold)",
                }}
              >
                VIP Only.
              </span>
            </motion.h1>

            {/* Subtext */}
            <motion.p
              custom={2}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="text-muted text-sm leading-relaxed mb-8 max-w-88"
            >
              Be the first to know. Get access to limited drops, secret releases
              and offers that never hit the public.
            </motion.p>

            {/* Form */}
            <motion.form
              custom={3}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              onSubmit={handleSubmit}
              className="flex flex-col gap-3"
            >
              {/* Password input */}
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className={[
                    "w-full px-5 py-4 pr-12",
                    "bg-surface-1 border border-border",
                    "text-text font-mono text-sm tracking-[0.12em]",
                    "placeholder:text-faint placeholder:normal-case placeholder:tracking-normal",
                    "rounded-sm focus:outline-none focus:border-gold transition-colors",
                    shake ? "animate-shake" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                />
                {/* Envelope / lock icon */}
                <span
                  aria-hidden
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-faint pointer-events-none"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="size-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m12 0H4.5a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 1.5 1.5h15a1.5 1.5 0 0 0 1.5-1.5V12a1.5 1.5 0 0 0-1.5-1.5Z" />
                  </svg>
                </span>
              </div>

              {/* Error message */}
              <AnimatePresence>
                {error && (
                  <motion.p
                    key="error"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-coral text-xs font-mono tracking-wider text-center"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* CTA button */}
              <motion.button
                type="submit"
                disabled={loading || !password.trim()}
                whileHover={!loading ? { y: -2, boxShadow: "0 0 28px rgba(201,168,76,0.35)" } : {}}
                whileTap={!loading ? { scale: 0.975 } : {}}
                className="w-full py-4 bg-gold text-bg font-display font-black text-base tracking-[0.22em] uppercase rounded-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-opacity"
                style={{ boxShadow: "var(--shadow-metallic)" }}
              >
                {loading ? (
                  <span className="opacity-70">Unlocking…</span>
                ) : (
                  <>
                    Unlock VIP Access
                    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className="size-4 shrink-0">
                      <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
                    </svg>
                  </>
                )}
              </motion.button>
            </motion.form>

            {/* Footnote */}
            <motion.p
              custom={4}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="flex items-center justify-center gap-1.5 mt-4 font-mono text-[11px] tracking-[0.22em] uppercase text-faint"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden className="size-3.5 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m12 0H4.5a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 1.5 1.5h15a1.5 1.5 0 0 0 1.5-1.5V12a1.5 1.5 0 0 0-1.5-1.5Z" />
              </svg>
              Private Access Only. No spam. Just the good stuff.
            </motion.p>
          </div>
        </div>

        {/* ─ Feature strip ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
          className="border-t border-border/50 bg-bg/70 backdrop-blur-sm"
        >
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="flex flex-col items-center text-center gap-2 py-6 px-4 border-b border-r border-border/20"
                >
                  <span className="text-gold">{feature.icon}</span>
                  <p className="font-mono text-[11px] font-bold tracking-[0.2em] uppercase text-text">
                    {feature.title}
                  </p>
                  <p className="font-sans text-[11px] text-muted leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              ))}

              {/* Member card — last cell */}
              <div className="flex flex-col items-center justify-center gap-1 py-6 px-4 border-b border-r border-border/20">
                <div
                  className="w-full max-w-30 aspect-[1.6/1] rounded-md flex flex-col items-center justify-center gap-1 border border-gold/30"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(201,168,76,0.12) 0%, rgba(13,13,13,0.9) 100%)",
                    boxShadow: "0 4px 16px rgba(201,168,76,0.15)",
                  }}
                >
                  <p className="font-display font-black text-xl tracking-[0.08em] text-gold leading-none">
                    R1P
                  </p>
                  <p className="font-mono text-[9px] tracking-[0.22em] uppercase text-gold/80 leading-none">
                    Ohana Member
                  </p>
                  <span className="text-gold/60 text-sm mt-0.5">🌴</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bottom tagline */}
        <div className="bg-bg/80 backdrop-blur-sm py-4 border-t border-border/30">
          <p className="text-center font-mono text-[11px] tracking-[0.28em] uppercase text-faint">
            Discipline connects us.&nbsp; Purpose drives us.&nbsp; Passion defines us.
            <br className="sm:hidden" />
            <span className="hidden sm:inline">&nbsp; </span>
            <span className="text-gold">We are 1R P.</span>
          </p>
        </div>
      </div>
    </div>
  );
}
