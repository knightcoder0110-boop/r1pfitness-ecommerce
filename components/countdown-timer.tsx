"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { siteConfig } from "@/lib/siteConfig";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calcTimeLeft(target: Date): TimeLeft | null {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function Digit({ value, label }: { value: number; label: string }) {
  const display = String(value).padStart(2, "0");

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative overflow-hidden">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={display}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="block font-display text-5xl sm:text-7xl md:text-8xl countdown-number text-text"
          >
            {display}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="font-mono text-[10px] sm:text-xs tracking-[0.25em] uppercase text-text/50">
        {label}
      </span>
    </div>
  );
}

export default function CountdownTimer() {
  const dateStr = siteConfig.nextDropDate;
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Deliberate: avoids SSR hydration mismatch for time-dependent output.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    if (!dateStr) return;

    const target = new Date(dateStr);
    if (isNaN(target.getTime())) return;

    setTimeLeft(calcTimeLeft(target));
    const interval = setInterval(() => {
      const tl = calcTimeLeft(target);
      if (!tl) {
        clearInterval(interval);
        setTimeLeft(null);
      } else {
        setTimeLeft(tl);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [dateStr]);

  // Don't render anything if no date set or not mounted yet
  if (!mounted || !dateStr || !timeLeft) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="flex flex-col items-center gap-6"
    >
      {/* Badge */}
      <div className="inline-block border border-gold/50 px-4 py-1.5 rounded-sm">
        <span className="font-mono text-xs tracking-[0.3em] text-gold uppercase">
          Next Drop
        </span>
      </div>

      {/* Timer */}
      <div className="flex items-center gap-4 sm:gap-6 md:gap-8">
        <Digit value={timeLeft.days} label="Days" />
        <span className="font-display text-4xl sm:text-6xl text-gold/40 -mt-6">:</span>
        <Digit value={timeLeft.hours} label="Hrs" />
        <span className="font-display text-4xl sm:text-6xl text-gold/40 -mt-6">:</span>
        <Digit value={timeLeft.minutes} label="Min" />
        <span className="font-display text-4xl sm:text-6xl text-gold/40 -mt-6">:</span>
        <Digit value={timeLeft.seconds} label="Sec" />
      </div>
    </motion.div>
  );
}
