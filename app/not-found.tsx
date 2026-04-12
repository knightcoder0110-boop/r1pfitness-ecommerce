"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { siteConfig } from "@/lib/siteConfig";
import Toast, { ToastType } from "@/components/Toast";

/* ── URL → context parser ─────────────────────────────── */
function parseOldUrl(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0]?.toLowerCase() ?? "";

  if (first === "products" || first === "product") {
    return {
      badge: "LOCKED",
      headline: "THIS IS FOR OHANA ONLY",
      sub: "This is locked down for a reason.",
      detail: "We are not saying what it is. But the people on our list will know before anyone else. Get in or get left out.",
    };
  }
  if (first === "collections" || first === "collection") {
    return {
      badge: "LOCKED",
      headline: "THIS IS LOCKED DOWN",
      sub: "Not everyone gets access. That is the point.",
      detail: "We keep things very exclusive around here. If you are not on the list when it drops, you will hear about it after. Join the ohana now.",
    };
  }
  if (first === "cart" || first === "checkout") {
    return {
      badge: "EXCLUSIVE ACCESS",
      headline: "NOT FOR EVERYONE",
      sub: "Access here is password-protected. Ohana only.",
      detail: "If you have the password, head to the main gate. If you don't have it yet — get on the list. We drop the password to the ohana first. Always.",
    };
  }
  if (first === "discount") {
    return {
      badge: "OHANA",
      headline: "YOU ARE ALREADY CLOSE",
      sub: "That link brought you here for a reason.",
      detail: "You are clearly part of the circle. Make it official — get on the list and we will make sure you are first when it matters.",
    };
  }
  if (first === "account" || first === "login" || first === "services") {
    return {
      badge: "LOCKED",
      headline: "ACCESS IS BY INVITE ONLY",
      sub: "We do not let just anyone in.",
      detail: "Get on the list. When the time comes, the ohana gets the password first — before it ever goes anywhere else.",
    };
  }
  if (first === "pages" || first === "blogs" || first === "blog" || first === "contact") {
    return {
      badge: "LOCKED",
      headline: "WE ARE NOT TALKING YET",
      sub: "When we have something to say, the ohana hears it first.",
      detail: "Not ready to share what we are cooking. But when we are — you will want to already be on the list.",
    };
  }
  // Klaviyo / tracking / internal URLs (/_t/, /o/, checkouts, etc.)
  if (
    first.startsWith("_t") ||
    first === "o" ||
    first.match(/^[0-9]+$/) !== null
  ) {
    return {
      badge: "OHANA",
      headline: "YOU ARE IN THE RIGHT PLACE",
      sub: "You are clearly already close to the circle.",
      detail: "Get on the list. When it drops, the password goes to ohana first — before it goes anywhere else.",
    };
  }
  return {
    badge: "LOCKED",
    headline: "THIS IS LOCKED FOR A REASON",
    sub: "We are not explaining what it is. That is the point.",
    detail: "The people who are supposed to know — already know. If you are not on the list yet, now is the time. Ohana gets in first.",
  };
}

/* ── Glitch text effect ───────────────────────────────── */
function GlitchText({ text, className }: { text: string; className?: string }) {
  const [glitched, setGlitched] = useState(text);

  useEffect(() => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&";
    let iteration = 0;
    const interval = setInterval(() => {
      setGlitched(
        text
          .split("")
          .map((char, i) => {
            if (char === " ") return " ";
            if (i < iteration) return text[i];
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join("")
      );
      iteration += 1 / 2;
      if (iteration >= text.length) clearInterval(interval);
    }, 40);
    return () => clearInterval(interval);
  }, [text]);

  return <span className={className}>{glitched}</span>;
}

/* ── Floating particles (lightweight) ─────────────────── */
function FloatingOrbs() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
      <div className="absolute top-1/3 left-1/4 w-100 h-100 rounded-full bg-coral/8 blur-[120px] animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-87.5 h-87.5 rounded-full bg-gold/6 blur-[100px] animate-pulse-slow-delayed" />
      <div className="absolute top-2/3 left-2/3 w-62.5 h-62.5 rounded-full bg-ocean/10 blur-[100px] animate-pulse-slow" />
    </div>
  );
}

/* ── Stagger variants ─────────────────────────────────── */
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 25 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

/* ── Page ──────────────────────────────────────────────── */
export default function NotFound() {
  const pathname = usePathname();
  const ctx = parseOldUrl(pathname);

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: ToastType }>({
    visible: false,
    message: "",
    type: "success",
  });

  const showToast = (message: string, type: ToastType) => {
    setToast({ visible: true, message, type });
  };
  const dismissToast = () => setToast((t) => ({ ...t, visible: false }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus("success");
        showToast("Welcome to the ohana! You'll be first to know.", "success");
      } else {
        setStatus("error");
        showToast(data.error || "Something went wrong. Try again.", "error");
      }
    } catch {
      setStatus("error");
      showToast("Network error. Please try again.", "error");
    }
  };

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center min-h-screen overflow-hidden px-6 py-16">
      <FloatingOrbs />
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onDismiss={dismissToast} />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 flex flex-col items-center gap-6 sm:gap-8 text-center max-w-xl w-full"
      >
        {/* Brand name — big, unmistakable */}
        <motion.div variants={fadeUp} className="text-center">
          <h1 className="font-display text-5xl sm:text-7xl md:text-9xl tracking-widest leading-none">
            {siteConfig.brandName}
          </h1>
          <p className="font-serif italic text-base sm:text-lg md:text-xl text-text/40 mt-1 tracking-wider">
            {siteConfig.tagline}
          </p>
        </motion.div>

        {/* Status badge */}
        <motion.div variants={fadeUp}>
          <div className="inline-flex items-center gap-2 border border-coral/40 px-4 py-1.5 rounded-sm bg-coral/5">
            <span className="inline-block w-2 h-2 rounded-full bg-coral animate-pulse" />
            <span className="font-mono text-[10px] sm:text-xs tracking-[0.3em] text-coral uppercase">
              {ctx.badge}
            </span>
          </div>
        </motion.div>

        {/* Main headline with glitch */}
        <motion.div variants={fadeUp}>
          <h2 className="font-display text-3xl sm:text-5xl md:text-6xl tracking-[0.08em] leading-none drop-heading-glow">
            <GlitchText text={ctx.headline} />
          </h2>
        </motion.div>

        {/* Gold divider */}
        <motion.div variants={fadeUp} className="w-32 sm:w-48 h-px relative">
          <div className="absolute inset-0 bg-linear-to-r from-transparent via-gold to-transparent" />
          <div className="absolute inset-0 bg-linear-to-r from-transparent via-gold to-transparent blur-sm opacity-60" />
        </motion.div>

        {/* Context subtitle */}
        <motion.p variants={fadeUp} className="font-serif italic text-lg sm:text-xl text-gold leading-relaxed max-w-md">
          {ctx.sub}
        </motion.p>

        {/* Detail text */}
        <motion.p variants={fadeUp} className="font-serif italic text-base sm:text-lg text-text/75 leading-relaxed max-w-sm">
          {ctx.detail}
        </motion.p>

        {/* Email signup card */}
        <motion.div variants={fadeUp} className="w-full mt-2">
          <AnimatePresence mode="wait">
            {status === "success" ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-3 p-6 border border-gold/30 rounded-sm bg-gold/5"
              >
                <span className="text-4xl">🤙</span>
                <p className="font-display text-2xl sm:text-3xl tracking-[0.15em] text-gold">
                  YOU&apos;RE IN THE OHANA
                </p>
                <p className="font-serif italic text-sm text-text/50">
                  Watch your inbox. You&apos;ll be first through the door.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative p-px rounded-sm overflow-hidden"
              >
                {/* Animated border gradient */}
                <div className="absolute inset-0 rounded-sm bg-linear-to-r from-gold/40 via-coral/30 to-gold/40 animate-border-spin" />

                <div className="relative rounded-sm bg-bg/95 backdrop-blur-sm px-6 py-6 sm:px-8 sm:py-8 flex flex-col items-center gap-4">
                  <p className="font-display text-lg sm:text-xl tracking-[0.2em] text-text/80">
                    BE FIRST WHEN WE DROP
                  </p>
                  <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-3 w-full">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 text-center sm:text-left font-mono text-sm tracking-wider rounded-sm"
                      placeholder="your@email.com"
                      required
                    />
                    <motion.button
                      type="submit"
                      disabled={status === "loading"}
                      whileHover={{ y: -2, boxShadow: "0 0 20px rgba(196,87,42,0.3)" }}
                      whileTap={{ scale: 0.97 }}
                      className="w-full sm:w-auto px-6 py-3 bg-coral text-text font-display text-base tracking-[0.2em] uppercase rounded-sm transition-colors hover:bg-coral/90 disabled:opacity-60 cursor-pointer whitespace-nowrap"
                    >
                      {status === "loading" ? "..." : "JOIN"}
                    </motion.button>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Link back to main gate */}
        <motion.div variants={fadeUp} className="mt-4 w-full">
          <motion.a
            href="/"
            whileHover={{ y: -2, boxShadow: "0 0 28px rgba(201,168,76,0.35)" }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center justify-center gap-2 w-full py-4 border border-gold/60 bg-gold/5 hover:bg-gold/12 hover:border-gold text-gold font-display text-lg tracking-[0.2em] uppercase rounded-sm transition-all duration-200"
          >
            ← ENTER THE MAIN GATE
          </motion.a>
        </motion.div>
      </motion.div>
    </main>
  );
}
