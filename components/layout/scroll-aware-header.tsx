"use client";

import { useEffect, useRef, useState } from "react";

/**
 * ScrollAwareHeader — client wrapper that hides the sticky header when the
 * user is scrolling DOWN past a threshold, and reveals it the moment they
 * start scrolling UP again (standard premium-commerce pattern).
 *
 * Kept as a passive wrapper: the header itself (mega-menu, nav data) remains
 * a server component passed in as children.
 *
 * Uses `transform` + `position: sticky` so layout doesn't jump.
 */
export function ScrollAwareHeader({ children }: { children: React.ReactNode }) {
  const [hidden, setHidden] = useState(false);
  const lastYRef = useRef(0);
  const tickingRef = useRef(false);

  useEffect(() => {
    lastYRef.current = window.scrollY;

    function onScroll() {
      if (tickingRef.current) return;
      tickingRef.current = true;

      requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - lastYRef.current;
        const THRESHOLD = 8; // ignore micro-scroll jitter

        if (Math.abs(delta) > THRESHOLD) {
          // Near the top — always show.
          if (y < 80) {
            setHidden(false);
          } else if (delta > 0) {
            // Scrolling down — hide.
            setHidden(true);
          } else {
            // Scrolling up — show.
            setHidden(false);
          }
          lastYRef.current = y;
        }
        tickingRef.current = false;
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      data-hidden={hidden || undefined}
      className="sticky top-0 z-[40] w-full transition-transform duration-300 ease-out data-[hidden]:-translate-y-full will-change-transform"
    >
      {children}
    </div>
  );
}
