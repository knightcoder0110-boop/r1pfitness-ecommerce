"use client";

import { Clock, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import {
  SAME_DAY_CUTOFF_HOUR,
  STANDARD_TRANSIT_DAYS_MAX,
  STANDARD_TRANSIT_DAYS_MIN,
} from "@/lib/constants/shipping";
import { cn } from "@/lib/utils/cn";

export interface ShippingEstimateProps {
  className?: string;
}

const DAY_NAMES_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function isWeekend(d: Date): boolean {
  const dow = d.getDay();
  return dow === 0 || dow === 6;
}

function addBusinessDays(base: Date, days: number): Date {
  const d = new Date(base);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    if (!isWeekend(d)) added++;
  }
  return d;
}

function formatDate(d: Date): string {
  return `${DAY_NAMES_SHORT[d.getDay()]}, ${MONTH_NAMES_SHORT[d.getMonth()]} ${d.getDate()}`;
}

function formatCountdown(ms: number): string {
  const totalMin = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

interface Estimate {
  /** "Order in 4h 32m" or "Order today" — countdown to cutoff. */
  cutoff: string;
  /** "Mon, May 4 — Wed, May 6". */
  arrival: string;
  /** True if the cutoff has passed for today. */
  cutoffPassed: boolean;
}

function computeEstimate(now: Date): Estimate {
  // Determine the dispatch day:
  //   • Weekday before cutoff → today
  //   • Weekday after cutoff  → next business day
  //   • Weekend               → next business day (Mon)
  const cutoff = new Date(now);
  cutoff.setHours(SAME_DAY_CUTOFF_HOUR, 0, 0, 0);

  const isWknd = isWeekend(now);
  const cutoffPassed = isWknd || now >= cutoff;

  const dispatchDay = cutoffPassed ? addBusinessDays(now, 1) : new Date(now);

  const arriveStart = addBusinessDays(dispatchDay, STANDARD_TRANSIT_DAYS_MIN - 1);
  const arriveEnd = addBusinessDays(dispatchDay, STANDARD_TRANSIT_DAYS_MAX - 1);

  return {
    cutoff: cutoffPassed
      ? `Ships ${formatDate(dispatchDay)}`
      : `Order in ${formatCountdown(cutoff.getTime() - now.getTime())} → ships today`,
    arrival: `${formatDate(arriveStart)} — ${formatDate(arriveEnd)}`,
    cutoffPassed,
  };
}

/**
 * Live "order within / arrives by" estimate beneath the buy box.
 *
 *   ⏱ Order in 4h 32m → ships today
 *   🚚 Arrives Mon, May 4 — Wed, May 6
 *
 * Why client-side: the countdown ticks every minute. We avoid hydration
 * mismatch by rendering nothing on the server (`null`) and computing on
 * mount — the layout reserves space via `min-height` so the column doesn't
 * jump.
 *
 * Edge cases handled:
 *   • Pre-cutoff weekday → "ships today"
 *   • Post-cutoff weekday → "ships tomorrow"
 *   • Weekend → "ships Monday"
 *   • All transit windows skip Sat/Sun
 */
export function ShippingEstimate({ className }: ShippingEstimateProps) {
  const [estimate, setEstimate] = useState<Estimate | null>(null);

  useEffect(() => {
    const tick = () => setEstimate(computeEstimate(new Date()));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      role="note"
      aria-label="Shipping estimate"
      className={cn(
        "flex flex-col gap-1.5 min-h-[44px]",
        className,
      )}
    >
      {estimate ? (
        <>
          <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-text">
            <Clock aria-hidden strokeWidth={1.75} className="size-3.5 text-gold" />
            {estimate.cutoff}
          </span>
          <span className="inline-flex items-center gap-2 font-serif italic text-sm text-muted">
            <Truck aria-hidden strokeWidth={1.5} className="size-4 text-muted" />
            Arrives {estimate.arrival}
          </span>
        </>
      ) : null}
    </div>
  );
}
