"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * ScrollAwareHeader — thin client wrapper that pins the site header to the
 * top of the viewport at all times (`position: sticky`) and adds a subtle
 * "scrolled" state (stronger background + shadow) once the user leaves the
 * hero. The header never auto-hides on scroll-down — product requirement:
 * navigation must be reachable every pixel of the page.
 *
 * NOTE: `will-change: transform` is intentionally NOT applied here.
 * It would create a new CSS containing block for `position: fixed`
 * descendants (see CSS Containment spec), causing the MobileNav overlay
 * to be positioned relative to this sticky element's DOCUMENT layout
 * position rather than the viewport. At scroll=400px the nav panel would
 * render 400px above the visible area. The `<header>` child's
 * `backdrop-blur-lg` already promotes a GPU compositing layer, so
 * `will-change: transform` on this wrapper is both redundant and harmful.
 */
export function ScrollAwareHeader({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 24);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      data-scrolled={scrolled ? "true" : "false"}
      className={cn(
        "sticky top-0 z-[40] w-full",
      )}
    >
      {children}
    </div>
  );
}
