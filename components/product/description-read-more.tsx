"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils/cn";

const COLLAPSED_HEIGHT = 140; // px — ~5 lines of prose text

function ToggleButton({
  expanded,
  onClick,
}: {
  expanded: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.35em] text-gold hover:text-gold/70 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold rounded-sm"
    >
      {expanded ? (
        <>
          Read less
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} className="size-2.5" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10 8 6l-4 4" />
          </svg>
        </>
      ) : (
        <>
          Read more
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} className="size-2.5" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6l4 4 4-4" />
          </svg>
        </>
      )}
    </button>
  );
}

export function DescriptionReadMore({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [isTall, setIsTall] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    el.style.maxHeight = "none";
    const full = el.scrollHeight;
    el.style.maxHeight = "";
    setIsTall(full > COLLAPSED_HEIGHT + 20);
  }, [html]);

  const toggle = () => setExpanded((v) => !v);

  return (
    <div className={cn("relative flex flex-col gap-1", className)}>
      {/* Top header row — label on left, toggle on right */}
      <div className="flex items-center justify-between">
        <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-muted">
          Description
        </p>
        {isTall && <ToggleButton expanded={expanded} onClick={toggle} />}
      </div>

      {/* Content — `.rich-text` in globals.css is the single source of
          truth for all WooCommerce / CMS HTML styling. Never style raw
          HTML output here — add rules to that class instead. */}
      <div
        ref={contentRef}
        className={cn(
          "rich-text",
          "transition-[max-height] duration-500 ease-out overflow-hidden",
          !expanded && isTall ? "max-h-35" : "max-h-none",
        )}
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {/* Bottom fade + toggle when collapsed */}
      {!expanded && isTall && (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-7 h-16 bg-linear-to-t from-bg to-transparent"
          />
          <ToggleButton expanded={false} onClick={toggle} />
        </>
      )}
    </div>
  );
}
