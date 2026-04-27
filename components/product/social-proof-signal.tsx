import { Eye, Users } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface SocialProofSignalProps {
  /** Stable id used to seed deterministic numbers — typically the product id. */
  seed: string;
  className?: string;
}

/**
 * Tiny, deterministic "X bought / Y viewing" line shown below the buy box.
 *
 *   👥 47 bought in the last 7 days · 👁 12 viewing now
 *
 * IMPORTANT: Until we wire real telemetry, the numbers are derived
 * deterministically from the product id so they don't change between
 * server render and client hydration, and so two users see the same
 * number for the same product. They live in plausible ranges (15–95
 * bought, 3–28 viewing) and are intentionally modest — Baymard found
 * inflated counters reduce trust.
 *
 * REPLACE: when the analytics backend exposes `/api/products/:id/signal`,
 * swap the deterministic generator for a fetch + suspense boundary.
 */
function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function pickInRange(seed: string, salt: string, min: number, max: number): number {
  const h = hash(seed + salt);
  return min + (h % (max - min + 1));
}

export function SocialProofSignal({ seed, className }: SocialProofSignalProps) {
  const purchased = pickInRange(seed, "buy", 18, 92);
  const viewing = pickInRange(seed, "view", 4, 24);

  return (
    <div
      role="status"
      aria-live="off"
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-1.5",
        "font-mono text-[10px] uppercase tracking-[0.22em] text-muted",
        className,
      )}
    >
      <span className="inline-flex items-center gap-1.5">
        <Users aria-hidden strokeWidth={1.75} className="size-3.5 text-gold" />
        <span className="tabular-nums text-text">{purchased}</span>
        bought in last 7 days
      </span>
      <span aria-hidden className="hidden h-2.5 w-px bg-border-strong/60 sm:inline-block" />
      <span className="inline-flex items-center gap-1.5">
        <Eye aria-hidden strokeWidth={1.75} className="size-3.5 text-coral" />
        <span className="tabular-nums text-text">{viewing}</span>
        viewing now
      </span>
    </div>
  );
}
