"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  /** Span 2 columns in the grid (desktop). Defaults to false. */
  wide?: boolean;
}

export function Field({ label, error, wide, className, id, ...rest }: FieldProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className={cn("flex flex-col gap-1", wide && "sm:col-span-2", className)}>
      <label
        htmlFor={inputId}
        className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted"
      >
        {label}
        {rest.required && <span className="ml-0.5 text-coral">*</span>}
      </label>
      <input
        id={inputId}
        className={cn(
          "border border-border bg-bg px-3 py-2.5 font-sans text-sm text-text placeholder:text-faint",
          "outline-none ring-0 transition-colors",
          "focus:border-border-strong focus:ring-1 focus:ring-accent",
          error && "border-coral focus:border-coral focus:ring-coral/40",
        )}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...rest}
      />
      {error && (
        <p id={`${inputId}-error`} role="alert" className="font-mono text-[10px] text-coral">
          {error}
        </p>
      )}
    </div>
  );
}

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
  wide?: boolean;
}

export function SelectField({ label, error, options, wide, className, id, ...rest }: SelectFieldProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className={cn("flex flex-col gap-1", wide && "sm:col-span-2", className)}>
      <label
        htmlFor={inputId}
        className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted"
      >
        {label}
        {rest.required && <span className="ml-0.5 text-coral">*</span>}
      </label>
      <select
        id={inputId}
        className={cn(
          "border border-border bg-bg px-3 py-2.5 font-sans text-sm text-text",
          "outline-none ring-0 transition-colors",
          "focus:border-border-strong focus:ring-1 focus:ring-accent",
          error && "border-coral focus:border-coral focus:ring-coral/40",
        )}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...rest}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={`${inputId}-error`} role="alert" className="font-mono text-[10px] text-coral">
          {error}
        </p>
      )}
    </div>
  );
}
