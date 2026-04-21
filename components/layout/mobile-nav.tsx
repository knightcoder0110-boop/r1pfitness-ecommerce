"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface NavLinkItem {
  label: string;
  href: string;
}

export interface MobileNavProps {
  links: NavLinkItem[];
}

/**
 * Mobile-only hamburger nav. Shown below `sm:` breakpoint.
 *
 * Behaviour:
 *  - Opens a full-height overlay sheet from the top.
 *  - Closes on route change, Escape, or backdrop click.
 *  - Locks body scroll while open.
 *  - Focus-trap-lite: button receives focus on open.
 */
export function MobileNav({ links }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Escape to close + scroll lock while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Close when a nav link is activated. We do this on click (not via a
  // pathname-watching effect) so React's set-state-in-effect rule stays
  // happy, and so the menu feels instant regardless of nav latency.
  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        className="inline-flex h-10 w-10 items-center justify-center text-text transition-colors hover:text-text sm:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div
        id="mobile-nav-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        aria-hidden={!open}
        className={cn(
          "fixed inset-0 z-[60] sm:hidden",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        {/* Backdrop */}
        <button
          type="button"
          aria-label="Close navigation"
          tabIndex={open ? 0 : -1}
          onClick={() => setOpen(false)}
          className={cn(
            "absolute inset-0 bg-bg/80 backdrop-blur-sm transition-opacity duration-[var(--dur-slow)] ease-out",
            open ? "opacity-100" : "opacity-0",
          )}
        />

        {/* Sheet */}
        <div
          className={cn(
            "absolute inset-x-0 top-0 bg-bg border-b border-border-strong shadow-overlay transition-transform duration-[var(--dur-slow)] ease-out",
            open ? "translate-y-0" : "-translate-y-full",
          )}
        >
          <div className="flex h-16 items-center justify-end px-4">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close navigation"
              className="inline-flex h-10 w-10 items-center justify-center text-text transition-colors hover:text-text"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav aria-label="Primary mobile" className="pb-8">
            <ul className="flex flex-col">
              {links.map((link) => {
                const active = pathname === link.href;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={close}
                      className={cn(
                        "block px-6 py-4 font-display text-2xl tracking-wider transition-colors",
                        active ? "text-gold" : "text-text hover:text-gold",
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
}
