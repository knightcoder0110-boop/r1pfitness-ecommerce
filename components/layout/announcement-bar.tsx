"use client";

import { useEffect, useState } from "react";
import { freeShippingAnnouncement } from "@/lib/constants/shipping";

/**
 * AnnouncementBar — dismissible gold scrolling strip above the site header.
 *
 * Client component: needs localStorage to persist the dismissed state.
 * Renders nothing after the user clicks ×, and stays dismissed across
 * navigation. Re-appears when DISMISS_KEY is bumped (content change).
 */

const MESSAGES = [
  "24H DROPS ONLY · ONCE IT'S GONE IT'S GONE",
  freeShippingAnnouncement(),
  "WAIPAHU, HAWAII · EST. 2026",
  "LIMITED EDITION · NEVER RESTOCKED",
  "REBORN 1N PARADISE · R1P FITNESS",
];

// Bump this string to force the bar to reappear after content changes.
const DISMISS_KEY = "r1p-ann-dismissed-v1";

export function AnnouncementBar() {
  const [visible, setVisible] = useState(false); // start hidden to avoid SSR mismatch

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (!localStorage.getItem(DISMISS_KEY)) {
        setVisible(true);
      }
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  const track = [...MESSAGES, ...MESSAGES]; // duplicate for seamless CSS loop

  return (
    <div
      role="region"
      aria-label="Site announcements"
      className="bg-gold relative overflow-hidden py-2 select-none"
    >
      {/* Scrolling track */}
      <div
        aria-hidden
        className="flex whitespace-nowrap"
        style={{ animation: "r1p-ann-scroll 32s linear infinite" }}
      >
        {track.map((msg, i) => (
          <span
            key={i}
            className="text-bg inline-flex shrink-0 items-center gap-3 px-6 font-mono text-[10px] tracking-[0.4em] uppercase"
          >
            {msg}
            <span aria-hidden className="text-[8px] opacity-40">
              ◆
            </span>
          </span>
        ))}
      </div>

      {/* Visually-hidden live region for screen readers */}
      <p className="sr-only" aria-live="off">
        {MESSAGES[0]}
      </p>

      {/* Dismiss button */}
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss announcement"
        className="bg-bg text-gold absolute top-1/2 right-3 flex size-6 -translate-y-1/2 items-center justify-center rounded-full transition-colors hover:bg-[#1a1a1a] hover:text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
      >
        <svg
          aria-hidden
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          className="size-3"
        >
          <path d="m3 3 10 10M13 3 3 13" strokeLinecap="round" />
        </svg>
      </button>

      <style>{`
        @keyframes r1p-ann-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="r1p-ann-scroll"] {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
