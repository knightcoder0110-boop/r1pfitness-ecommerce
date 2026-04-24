"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * ScrollAwareHeader — thin client wrapper that pins the site header to the
 * top of the viewport at all times (`position: sticky`) and adds a subtle
 * "scrolled" state (stronger background + shadow) once the user leaves the
 * hero. The header never auto-hides on scroll-down — product requirement:
 * navigation must be reachable every pixel of the page.
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
        "sticky top-0 z-[40] w-full will-change-transform",
      )}
    >
      {children}
    </div>
  );
}
