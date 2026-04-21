"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils/cn";

const COLLAPSED_HEIGHT = 140; // px — ~5 lines of prose text

/**
 * Renders HTML product description collapsed to ~5 lines.
 * A "Read more / Read less" toggle expands / collapses with a smooth height
 * transition and a fade-out gradient mask at the bottom.
 */
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

  // Measure actual rendered height after mount. Re-measure if html changes.
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    // Temporarily remove height constraint to get the real scrollHeight.
    el.style.maxHeight = "none";
    const full = el.scrollHeight;
    el.style.maxHeight = "";
    setIsTall(full > COLLAPSED_HEIGHT + 20); // 20px buffer
  }, [html]);

  return (
    <div className={cn("relative", className)}>
      <div
        ref={contentRef}
        className={cn(
          "prose prose-invert max-w-none font-serif text-muted",
          "transition-[max-height] duration-500 ease-out overflow-hidden",
          !expanded && isTall ? "max-h-[140px]" : "max-h-[none]",
        )}
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {/* Fade-out gradient when collapsed */}
      {!expanded && isTall && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-bg to-transparent"
        />
      )}

      {/* Toggle button */}
      {isTall && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.35em] text-gold hover:text-gold/70 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold rounded-sm"
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
      )}
    </div>
  );
}
