"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { siteConfig } from "@/lib/siteConfig";
import CountdownTimer from "@/components/CountdownTimer";
import PasswordGate from "@/components/PasswordGate";
import SignupForm from "@/components/SignupForm";
import Marquee from "@/components/Marquee";
import Manifesto from "@/components/Manifesto";

type View = "password" | "signup";

export default function Home() {
  const [view, setView] = useState<View>("password");

  return (
    <main className="flex flex-1 flex-col items-center min-h-screen">
      {/* ── Hero Section ─────────────────────────────────── */}
      <section className="flex flex-col items-center justify-center gap-10 sm:gap-14 w-full px-6 pt-20 pb-12 sm:pt-28 sm:pb-16">
        {/* Brand */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-center"
        >
          <h1 className="font-display text-6xl sm:text-8xl md:text-9xl tracking-widest leading-none">
            {siteConfig.brandName}
          </h1>
          <p className="font-serif italic text-lg sm:text-xl md:text-2xl text-text/50 mt-2 tracking-wider">
            {siteConfig.tagline}
          </p>
        </motion.div>

        {/* Countdown */}
        <CountdownTimer />

        <hr className="gold-rule w-full max-w-xs" />

        {/* Form Area — password or signup */}
        <AnimatePresence mode="wait">
          {view === "password" ? (
            <PasswordGate
              key="password"
              onSwitchToSignup={() => setView("signup")}
            />
          ) : (
            <SignupForm
              key="signup"
              onSwitchToPassword={() => setView("password")}
            />
          )}
        </AnimatePresence>
      </section>

      {/* ── Marquee ──────────────────────────────────────── */}
      <Marquee />

      {/* ── Manifesto ────────────────────────────────────── */}
      <section className="w-full max-w-2xl mx-auto px-6">
        <hr className="gold-rule w-full" />
        <Manifesto />
        <hr className="gold-rule w-full" />
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="w-full py-10 sm:py-14 text-center">
        <p className="font-mono text-[10px] sm:text-xs tracking-[0.3em] uppercase text-text/25">
          {siteConfig.address}
        </p>
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-text/15 mt-2">
          © {new Date().getFullYear()} {siteConfig.brandName}
        </p>
      </footer>
    </main>
  );
}
