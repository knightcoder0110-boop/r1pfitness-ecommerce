"use client";

import { motion } from "framer-motion";
import Sparkles from "@/components/Sparkles";
import ShootingStars from "@/components/ShootingStars";

/* ── stagger helpers ───────────────────────────────────── */
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15, delayChildren: 0.3 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" as const } },
};

const scalePop = {
  hidden: { opacity: 0, scale: 0.6 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.6, type: "spring" as const, bounce: 0.3 } },
};

/* ── letter-by-letter reveal ──────────────────────────── */
function RevealText({
  text,
  className,
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  return (
    <span className={className} aria-label={text}>
      {text.split("").map((char, i) => (
        <motion.span
          key={`${char}-${i}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.05,
            delay: delay + i * 0.04,
            ease: "easeOut",
          }}
          className="inline-block"
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </span>
  );
}

export default function DropPage() {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center min-h-screen overflow-hidden">
      {/* ── Background effects ─────────────────────────── */}
      <Sparkles count={80} />
      <ShootingStars />

      {/* ── Spotlight glow ─────────────────────────────── */}
      <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] sm:w-[800px] sm:h-[800px] rounded-full bg-gold/5 blur-[120px] animate-pulse-slow" />
        <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-coral/8 blur-[100px] animate-pulse-slow-delayed" />
      </div>

      {/* ── Content ────────────────────────────────────── */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 flex flex-col items-center gap-6 sm:gap-8 px-6 text-center max-w-2xl"
      >
        {/* Shaka emoji */}
        <motion.div variants={scalePop} className="text-6xl sm:text-7xl">
          🤙
        </motion.div>

        {/* Main headline */}
        <motion.div variants={fadeUp}>
          <h1 className="font-display text-5xl sm:text-7xl md:text-8xl tracking-[0.08em] leading-none drop-heading-glow">
            <RevealText text="YOU'RE IN," delay={0.5} />
            <br />
            <span className="text-gold">
              <RevealText text="OHANA" delay={1.1} />
            </span>
          </h1>
        </motion.div>

        {/* Gold divider with glow */}
        <motion.div
          variants={fadeUp}
          className="w-40 sm:w-56 h-px relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold to-transparent blur-sm opacity-60" />
        </motion.div>

        {/* Subtitle */}
        <motion.p
          variants={fadeUp}
          className="font-serif italic text-lg sm:text-xl md:text-2xl text-text/70 leading-relaxed max-w-lg"
        >
          Welcome to the inner circle. You cracked the code.
          <br />
          <span className="text-text/90">When the drop goes live, you&apos;ll be first through the door.</span>
        </motion.p>

        {/* Glowing card */}
        <motion.div
          variants={fadeUp}
          className="relative mt-4 p-px rounded-lg overflow-hidden group"
        >
          {/* Animated border gradient */}
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-gold/60 via-coral/40 to-gold/60 animate-border-spin" />

          {/* Card interior */}
          <div className="relative rounded-lg bg-bg/95 backdrop-blur-sm px-8 py-8 sm:px-12 sm:py-10 flex flex-col items-center gap-5">
            <p className="font-display text-2xl sm:text-3xl tracking-[0.15em] text-gold">
              EXCLUSIVE ACCESS
            </p>
            <div className="w-12 h-px bg-gradient-to-r from-transparent via-text/30 to-transparent" />
            <p className="font-serif italic text-sm sm:text-base text-text/60 leading-relaxed max-w-sm">
              Real ones get in before the rest.
              This drop is limited — once it&apos;s gone, it&apos;s gone.
              Keep your eyes on your inbox.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-block w-2 h-2 rounded-full bg-coral animate-pulse" />
              <span className="font-mono text-xs tracking-[0.3em] uppercase text-coral/80">
                Drop Pending
              </span>
            </div>
          </div>
        </motion.div>

        {/* Bottom tagline */}
        <motion.div variants={fadeUp} className="mt-4 flex flex-col items-center gap-3">
          <p className="font-display text-sm sm:text-base tracking-[0.3em] text-text/30">
            R1P FITNESS
          </p>
          <p className="font-serif italic text-xs sm:text-sm text-text/20">
            REBORN 1N PARADISE
          </p>
        </motion.div>

        {/* Back link */}
        <motion.a
          variants={fadeUp}
          href="/"
          className="mt-6 font-mono text-xs tracking-[0.2em] uppercase text-text/25 hover:text-gold transition-colors underline underline-offset-4 decoration-text/10 hover:decoration-gold/40"
        >
          ← Back to gate
        </motion.a>
      </motion.div>
    </main>
  );
}
