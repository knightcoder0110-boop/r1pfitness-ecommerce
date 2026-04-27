"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Mail } from "lucide-react";
import { useToastStore } from "@/lib/toast";

/* ── Feature strip data ─────────────────────────────────────────── */
const FEATURES = [
  {
    title: "Early Access",
    desc: "Get first access to every limited drop.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden
        className="size-7"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 13.5 13.5 3l-2.25 7.5h6L9 21l1.5-7.5h-6.75Z"
        />
      </svg>
    ),
  },
  {
    title: "Secret Releases",
    desc: "Exclusive products you won't find anywhere else.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden
        className="size-7"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m12 0H4.5a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 1.5 1.5h15a1.5 1.5 0 0 0 1.5-1.5V12a1.5 1.5 0 0 0-1.5-1.5Z"
        />
      </svg>
    ),
  },
  {
    title: "VIP Discounts",
    desc: "Special offers and discounts for members only.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden
        className="size-7"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0c1.1.128 1.907 1.077 1.907 2.185ZM9.75 9h.008v.008H9.75V9Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm4.125 4.5h.008v.008h-.008V13.5Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
        />
      </svg>
    ),
  },
  {
    title: "Member Rewards",
    desc: "Earn points, unlock rewards and get surprise gifts.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden
        className="size-7"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
        />
      </svg>
    ),
  },
  {
    title: "Ohana Forever",
    desc: "You're not a customer. You're family.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden
        className="size-7"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3c-2 3-3 5-3 7a3 3 0 1 0 6 0c0-2-1-4-3-7Z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 11c2 1 4 1 6 0M20 11c-2 1-4 1-6 0M6 8c2 0 3 1 4 3M18 8c-2 0-3 1-4 3M12 13v8M8 21h8"
        />
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
    transition: {
      duration: 0.55,
      delay: i * 0.08,
      ease: [0.2, 0.8, 0.2, 1] as [number, number, number, number],
    },
  }),
};

export default function SiteLockScreen() {
  const showToast = useToastStore((s) => s.show);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [mode, setMode] = useState<"password" | "join">("password");
  const [email, setEmail] = useState("");
  const [signupError, setSignupError] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

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

      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (res.ok) {
        // Reload to the home page — the cookie is now set server-side
        window.location.href = "/";
      } else {
        const message =
          res.status === 401
            ? "Wrong password. Join the Ohana to get it first."
            : (data?.error ?? "Something went wrong. Try again.");

        setError(message);
        setShake(true);
        if (res.status === 401) {
          setPassword("");
        }
        setTimeout(() => setShake(false), 600);
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || signupLoading || signupSuccess) return;

    setSignupLoading(true);
    setSignupError("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        error?: { message?: string };
      } | null;

      if (res.ok && data?.ok) {
        setSignupSuccess(true);
        setEmail("");
        showToast("You're on the VIP list. Welcome to the ohana.", "success");
        return;
      }

      const message = data?.error?.message ?? "Could not join the list. Try again.";
      setSignupError(message);
      showToast(message, "error");
    } catch {
      const message = "Network error. Check your connection and try again.";
      setSignupError(message);
      showToast(message, "error");
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <div className="bg-bg relative min-h-screen w-full overflow-x-clip">
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
        <div aria-hidden className="bg-bg/82 absolute inset-0 md:hidden" />

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
          className="from-bg absolute inset-x-0 top-0 h-28 bg-linear-to-b to-transparent"
        />

        {/* Bottom vignette — fades into feature strip */}
        <div
          aria-hidden
          className="from-bg absolute inset-x-0 bottom-0 h-48 bg-linear-to-t to-transparent"
        />
      </div>

      {/* ── Ohana badge watermark — top-right corner (desktop) ───── */}
      <div
        aria-hidden
        className="border-gold/20 absolute top-8 right-8 z-10 hidden size-24 flex-col items-center justify-center rounded-full border opacity-30 md:flex"
        style={{
          background:
            "radial-gradient(circle at center, rgba(201,168,76,0.08) 0%, transparent 70%)",
        }}
      >
        <span className="font-display text-gold text-center text-[9px] leading-tight tracking-[0.25em] uppercase">
          Ohana
          <br />
          Forever
        </span>
        <span className="text-gold mt-0.5 text-sm">🌴</span>
        <span className="font-display text-gold/70 mt-0.5 text-center text-[7px] leading-tight tracking-[0.3em] uppercase">
          R1P Fitness
        </span>
      </div>

      {/* ── Main layout ──────────────────────────────────────────── */}
      <div className="relative z-10 flex min-h-screen flex-col">
        {/* ─ Center section — content ─────────────────────────── */}
        <div className="flex flex-1 items-center justify-center px-6 py-10 md:justify-start md:px-0 md:py-20 md:pl-[8%] xl:pl-[12%]">
          <div className="w-full max-w-md">
            {/* Eyebrow */}
            <motion.div
              custom={0}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="mb-6 flex items-center gap-3"
            >
              <div className="bg-gold/40 h-px flex-1" />
              <p className="text-gold font-mono text-[11px] tracking-[0.32em] uppercase">
                Join the Ohana
              </p>
              <div className="bg-gold/40 h-px flex-1" />
            </motion.div>

            {/* Headline — matches reference: 3 stacked lines */}
            <motion.h1
              custom={1}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="font-display mb-5 leading-[0.88] font-black tracking-tight uppercase"
            >
              <span className="text-text block" style={{ fontSize: "clamp(2rem, 7vw, 4.5rem)" }}>
                Early Access.
              </span>
              <span className="text-text block" style={{ fontSize: "clamp(2rem, 7vw, 4.5rem)" }}>
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
              className="text-muted mb-8 max-w-88 text-sm leading-relaxed"
            >
              Be the first to know. Get access to limited drops, secret releases and offers that
              never hit the public.
            </motion.p>

            <AnimatePresence mode="wait" initial={false}>
              {mode === "password" ? (
                <motion.div
                  key="password-panel"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.24, ease: "easeOut" }}
                >
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
                          "bg-surface-1 border-border border",
                          "text-text font-mono text-sm tracking-[0.12em]",
                          "placeholder:text-faint placeholder:tracking-normal placeholder:normal-case",
                          "focus:border-gold rounded-sm transition-colors focus:outline-none",
                          shake ? "animate-shake" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      />
                      {/* Envelope / lock icon */}
                      <span
                        aria-hidden
                        className="text-faint pointer-events-none absolute top-1/2 right-4 -translate-y-1/2"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.5}
                          className="size-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m12 0H4.5a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 1.5 1.5h15a1.5 1.5 0 0 0 1.5-1.5V12a1.5 1.5 0 0 0-1.5-1.5Z"
                          />
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
                          className="text-coral text-center font-mono text-xs tracking-wider"
                        >
                          {error}
                        </motion.p>
                      )}
                    </AnimatePresence>

                    {/* CTA button */}
                    <motion.button
                      type="submit"
                      disabled={loading || !password.trim()}
                      whileHover={
                        !loading ? { y: -2, boxShadow: "0 0 28px rgba(201,168,76,0.35)" } : {}
                      }
                      whileTap={!loading ? { scale: 0.975 } : {}}
                      className="bg-gold text-bg font-display flex w-full items-center justify-center gap-3 rounded-sm py-4 text-base font-black tracking-[0.22em] uppercase transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                      style={{ boxShadow: "var(--shadow-metallic)" }}
                    >
                      {loading ? (
                        <span className="opacity-70">Unlocking…</span>
                      ) : (
                        <>
                          Unlock VIP Access
                          <svg
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden
                            className="size-4 shrink-0"
                          >
                            <path
                              fillRule="evenodd"
                              d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </>
                      )}
                    </motion.button>
                  </motion.form>

                  <motion.div
                    custom={4}
                    variants={fadeUp}
                    initial="hidden"
                    animate="show"
                    className="mt-4 flex flex-col gap-3"
                  >
                    <div className="text-faint flex items-center gap-3">
                      <span className="bg-border h-px flex-1" />
                      <span className="font-mono text-[10px] tracking-[0.25em] uppercase">
                        No password?
                      </span>
                      <span className="bg-border h-px flex-1" />
                    </div>

                    <motion.button
                      type="button"
                      onClick={() => {
                        setMode("join");
                        setError("");
                        setSignupError("");
                      }}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.975 }}
                      className="border-border bg-surface-1/80 text-text hover:border-gold hover:text-gold font-display flex w-full items-center justify-center gap-3 rounded-sm border px-5 py-4 text-sm font-black tracking-[0.18em] uppercase transition-colors"
                    >
                      <Mail aria-hidden className="size-4 shrink-0" />
                      Join the VIP List
                    </motion.button>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  key="join-panel"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.24, ease: "easeOut" }}
                  className="flex flex-col gap-4"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setMode("password");
                      setSignupError("");
                    }}
                    className="text-faint hover:text-gold inline-flex w-fit items-center gap-2 font-mono text-[10px] tracking-[0.22em] uppercase transition-colors"
                  >
                    <ArrowLeft aria-hidden className="size-3.5" />
                    Back to password
                  </button>

                  <div className="border-border bg-surface-1/80 rounded-sm border p-5 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-sm">
                    <div className="mb-5 flex flex-col gap-2">
                      <p className="text-gold font-mono text-[10px] tracking-[0.32em] uppercase">
                        First Drop VIP
                      </p>
                      <h2 className="font-display text-text text-2xl leading-none tracking-[0.12em] uppercase">
                        Join the R1P Ohana
                      </h2>
                      <p className="text-muted text-sm leading-relaxed">
                        Get first access to the launch drop, early discounts, and family-only
                        release notes before the doors open.
                      </p>
                    </div>

                    {signupSuccess ? (
                      <div
                        className="border-gold/35 bg-gold/10 rounded-sm border px-4 py-4"
                        role="status"
                      >
                        <p className="text-gold font-serif text-base italic">
                          You&apos;re in. We&apos;ll send the first-drop details to your inbox.
                        </p>
                        <p className="text-muted mt-2 font-mono text-[10px] tracking-[0.2em] uppercase">
                          Mahalo for joining the family.
                        </p>
                      </div>
                    ) : (
                      <form onSubmit={handleSignup} className="flex flex-col gap-3" noValidate>
                        <label htmlFor="vip-email" className="sr-only">
                          Email address
                        </label>
                        <input
                          id="vip-email"
                          name="email"
                          type="email"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (signupError) setSignupError("");
                          }}
                          required
                          autoComplete="email"
                          placeholder="your@email.com"
                          disabled={signupLoading}
                          className="border-border bg-bg/80 text-text placeholder:text-faint focus:border-gold w-full rounded-sm border px-5 py-4 font-mono text-sm tracking-[0.06em] transition-colors focus:outline-none disabled:opacity-50"
                        />

                        <AnimatePresence>
                          {signupError && (
                            <motion.p
                              key="signup-error"
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              className="text-coral text-center font-mono text-xs tracking-wider"
                            >
                              {signupError}
                            </motion.p>
                          )}
                        </AnimatePresence>

                        <motion.button
                          type="submit"
                          disabled={signupLoading || !email.trim()}
                          whileHover={
                            !signupLoading
                              ? { y: -2, boxShadow: "0 0 28px rgba(201,168,76,0.28)" }
                              : {}
                          }
                          whileTap={!signupLoading ? { scale: 0.975 } : {}}
                          className="bg-gold text-bg font-display flex w-full items-center justify-center gap-3 rounded-sm py-4 text-base font-black tracking-[0.2em] uppercase transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                          style={{ boxShadow: "var(--shadow-metallic)" }}
                        >
                          {signupLoading ? "Joining..." : "Get First Access"}
                        </motion.button>
                      </form>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footnote */}
            <motion.p
              custom={5}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="text-faint mt-4 flex items-center justify-center gap-1.5 font-mono text-[11px] tracking-[0.22em] uppercase"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden
                className="size-3.5 shrink-0"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m12 0H4.5a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 1.5 1.5h15a1.5 1.5 0 0 0 1.5-1.5V12a1.5 1.5 0 0 0-1.5-1.5Z"
                />
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
          className="border-border/50 bg-bg/70 border-t backdrop-blur-sm"
        >
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="border-border/20 flex flex-col items-center gap-2 border-r border-b px-4 py-6 text-center"
                >
                  <span className="text-gold">{feature.icon}</span>
                  <p className="text-text font-mono text-[11px] font-bold tracking-[0.2em] uppercase">
                    {feature.title}
                  </p>
                  <p className="text-muted font-sans text-[11px] leading-relaxed">{feature.desc}</p>
                </div>
              ))}

              {/* Member card — last cell */}
              <div className="border-border/20 flex flex-col items-center justify-center gap-1 border-r border-b px-4 py-6">
                <div
                  className="border-gold/30 flex aspect-[1.6/1] w-full max-w-30 flex-col items-center justify-center gap-1 rounded-md border"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(201,168,76,0.12) 0%, rgba(13,13,13,0.9) 100%)",
                    boxShadow: "0 4px 16px rgba(201,168,76,0.15)",
                  }}
                >
                  <p className="font-display text-gold text-xl leading-none font-black tracking-[0.08em]">
                    R1P
                  </p>
                  <p className="text-gold/80 font-mono text-[9px] leading-none tracking-[0.22em] uppercase">
                    Ohana Member
                  </p>
                  <span className="text-gold/60 mt-0.5 text-sm">🌴</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bottom tagline */}
        <div className="bg-bg/80 border-border/30 border-t py-4 backdrop-blur-sm">
          <p className="text-faint text-center font-mono text-[11px] tracking-[0.28em] uppercase">
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
