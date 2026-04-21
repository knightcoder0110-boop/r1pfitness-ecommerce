"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface QuantityStepperProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (next: number) => void;
  "aria-label"?: string;
  className?: string;
}

/**
 * Accessible qty stepper. Controlled.
 *
 * - Buttons clamp to min/max and no-op at bounds instead of firing onChange.
 * - Separate + / − buttons each own a clear aria-label ("Increase quantity").
 * - The numeric readout is a `<span>`, not an `<input>`, because we never want
 *   users typing into it on a cart line (it's easy to create phantom decimals
 *   and empty-string edge cases). If we need typed input we add a separate
 *   `QuantityInput` variant.
 */
export function QuantityStepper({
  value,
  min = 1,
  max = 99,
  onChange,
  className,
  ...aria
}: QuantityStepperProps) {
  const dec = () => {
    if (value <= min) return;
    onChange(value - 1);
  };
  const inc = () => {
    if (value >= max) return;
    onChange(value + 1);
  };

  return (
    <div
      role="group"
      aria-label={aria["aria-label"] ?? "Quantity"}
      className={cn(
        "inline-flex items-center border border-border-strong rounded-sm bg-transparent",
        className,
      )}
    >
      <button
        type="button"
        onClick={dec}
        disabled={value <= min}
        aria-label="Decrease quantity"
        className="h-9 w-9 inline-flex items-center justify-center text-muted hover:text-text disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span
        aria-live="polite"
        className="h-9 min-w-[2.5rem] inline-flex items-center justify-center font-mono text-sm tabular-nums text-text"
      >
        {value}
      </span>
      <button
        type="button"
        onClick={inc}
        disabled={value >= max}
        aria-label="Increase quantity"
        className="h-9 w-9 inline-flex items-center justify-center text-muted hover:text-text disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
