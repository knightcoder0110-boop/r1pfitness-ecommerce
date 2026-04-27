"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calc(target: Date): TimeLeft | null {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1_000) % 60),
  };
}

function Digit({ value, label }: { value: number; label: string }) {
  const display = String(value).padStart(2, "0");
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative overflow-hidden min-w-[2ch] text-center">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={display}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="block font-display text-5xl sm:text-7xl tracking-widest text-text"
          >
            {display}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
        {label}
      </span>
    </div>
  );
}

interface CampaignCountdownProps {
  dropDate: string;
  onExpired?: () => void;
}

export function CampaignCountdown({ dropDate, onExpired }: CampaignCountdownProps) {
  const target = new Date(dropDate);
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    const tick = () => {
      const t = calc(target);
      setTimeLeft(t);
      if (!t) {
        onExpired?.();
      }
      return t;
    };

    const initial = tick();
    if (!initial) {
      return;
    }

    const interval = setInterval(() => {
      const next = tick();
      if (!next) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dropDate]);

  if (!timeLeft) {
    return (
      <div aria-hidden className="flex items-start gap-4 sm:gap-6 invisible">
        <Digit value={0} label="Days" />
        <span className="font-display text-4xl sm:text-6xl text-muted mt-1">:</span>
        <Digit value={0} label="Hours" />
        <span className="font-display text-4xl sm:text-6xl text-muted mt-1">:</span>
        <Digit value={0} label="Min" />
        <span className="font-display text-4xl sm:text-6xl text-muted mt-1">:</span>
        <Digit value={0} label="Sec" />
      </div>
    );
  }

  return (
    <div className="flex items-start gap-4 sm:gap-6">
      <Digit value={timeLeft.days} label="Days" />
      <span className="font-display text-4xl sm:text-6xl text-muted mt-1">:</span>
      <Digit value={timeLeft.hours} label="Hours" />
      <span className="font-display text-4xl sm:text-6xl text-muted mt-1">:</span>
      <Digit value={timeLeft.minutes} label="Min" />
      <span className="font-display text-4xl sm:text-6xl text-muted mt-1">:</span>
      <Digit value={timeLeft.seconds} label="Sec" />
    </div>
  );
}
