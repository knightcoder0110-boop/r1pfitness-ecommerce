"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import type { ProductAttribute } from "@/lib/woo/types";

export interface VariantPickerProps {
  attributes: ProductAttribute[];
  /** Optional controlled selection. If omitted, component manages state. */
  value?: Record<string, string>;
  onChange?: (selection: Record<string, string>) => void;
}

/**
 * Renders the variation attributes (Size, Color, etc.) as option chips.
 *
 * Phase 1a: visual + state only — `onChange` is wired so the PDP can track the
 * selection. Phase 1b will propagate the selection to the cart.
 */
export function VariantPicker({ attributes, value, onChange }: VariantPickerProps) {
  const [internal, setInternal] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const a of attributes) if (a.variation && a.options[0]) initial[a.id] = a.options[0];
    return initial;
  });
  const selection = value ?? internal;

  const variationAttrs = attributes.filter((a) => a.variation);
  if (variationAttrs.length === 0) return null;

  const update = (attrId: string, option: string) => {
    const next = { ...selection, [attrId]: option };
    if (!value) setInternal(next);
    onChange?.(next);
  };

  return (
    <div className="flex flex-col divide-y divide-border/40">
      {variationAttrs.map((attr) => {
        const selected = selection[attr.id];
        return (
          <fieldset key={attr.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0">
            <legend className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
              {attr.name}
              {selected ? (
                <span className="ml-2 font-normal normal-case tracking-[0.15em] text-text">
                  — {selected}
                </span>
              ) : null}
            </legend>
            <div role="radiogroup" aria-label={attr.name} className="flex flex-wrap gap-2">
              {attr.options.map((option) => {
                const isSelected = selected === option;
                return (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => update(attr.id, option)}
                    className={cn(
                      "min-w-11 rounded-sm border px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.18em] transition-all duration-150 cursor-pointer",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1 focus-visible:ring-offset-bg",
                      isSelected
                        ? "border-gold bg-gold/10 text-gold"
                        : "border-border bg-surface-1 text-muted hover:border-border-strong hover:bg-surface-2 hover:text-text",
                    )}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
