"use client";

import { useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/* ─── Types ─────────────────────────────────────────────────── */

export interface NavSubItem {
  label: string;
  href: string;
  description?: string;
}

export interface NavGroup {
  title: string;
  items: NavSubItem[];
}

export interface NavFeatured {
  image: string;
  badge?: string;
  title: string;
  subtitle?: string;
  href: string;
  cta?: string;
}

export interface NavLinkItem {
  label: string;
  href: string;
  groups?: NavGroup[];
  featured?: NavFeatured;
}

/* ─── Component ──────────────────────────────────────────────── */

interface DesktopNavProps {
  links: NavLinkItem[];
}

export function DesktopNav({ links }: DesktopNavProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();

  const openMenu = useCallback((label: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setActiveMenu(label);
  }, []);

  const scheduleClose = useCallback(() => {
    closeTimer.current = setTimeout(() => setActiveMenu(null), 120);
  }, []);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  const closeNow = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setActiveMenu(null);
  }, []);

  const activeLink = links.find((l) => l.label === activeMenu);
  const hasMegaOpen = !!(activeLink?.groups?.length);

  return (
    <>
      {/* ── Desktop nav links ─────────────────────────── */}
      <nav aria-label="Primary" className="hidden sm:block">
        <ul className="flex items-center gap-5 md:gap-7 font-mono text-[11px] uppercase tracking-[0.25em]">
          {links.map((link, i) => {
            const hasMega = !!(link.groups?.length);
            const isActive =
              pathname === link.href ||
              (link.href !== "/" && pathname.startsWith(link.href + "/"));

            return (
              <li
                key={link.href}
                className={cn(
                  "relative",
                  i >= 4 ? "hidden lg:block" : i >= 3 ? "hidden md:block" : "",
                )}
                onMouseEnter={() => (hasMega ? openMenu(link.label) : scheduleClose())}
                onMouseLeave={scheduleClose}
              >
                <Link
                  href={link.href}
                  className={cn(
                    "flex items-center gap-1 py-1 transition-colors",
                    "duration-(--dur-fast)",
                    isActive ? "text-text" : "text-text hover:text-gold",
                  )}
                  style={{ opacity: isActive ? 1 : 0.75 }}
                >
                  {link.label}
                  {hasMega && (
                    <ChevronDown
                      className={cn(
                        "h-2.5 w-2.5 transition-transform duration-(--dur-fast)",
                        activeMenu === link.label && "rotate-180",
                      )}
                    />
                  )}
                </Link>

                {/* Active indicator bar */}
                <span
                  className={cn(
                    "absolute -bottom-px left-0 right-0 h-px bg-gold transition-opacity duration-(--dur-fast)",
                    isActive ? "opacity-100" : "opacity-0",
                  )}
                />
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ── Mega menu panel — fixed, full-width, below header ── */}
      <div
        onMouseEnter={cancelClose}
        onMouseLeave={scheduleClose}
        aria-hidden={!hasMegaOpen}
        className={cn(
          "fixed left-0 right-0 z-50 hidden sm:block",
          "transition-[opacity,transform]",
          "duration-(--dur-slow) ease-out",
          hasMegaOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-1 pointer-events-none",
        )}
        style={{ top: "calc(var(--size-header) + 1px)" }}
      >
        <div
          className="border-b border-border-strong shadow-overlay"
          style={{ background: "rgba(13,13,13,0.97)", backdropFilter: "blur(20px)" }}
        >
          {links.map((link) => {
            if (!link.groups?.length) return null;
            const isThisOpen = activeMenu === link.label;

            return (
              <div
                key={link.label}
                className={cn(
                  "transition-opacity duration-(--dur-base)",
                  isThisOpen ? "opacity-100" : "opacity-0 absolute pointer-events-none",
                )}
              >
                <div
                  className="mx-auto px-8 py-10"
                  style={{ maxWidth: "var(--size-container)" }}
                >
                  <div className="grid gap-10"
                    style={{ gridTemplateColumns: link.featured ? "1fr 300px" : "1fr" }}
                  >
                    {/* ── Link columns ────────────────── */}
                    <div
                      className="grid gap-10"
                      style={{ gridTemplateColumns: `repeat(${link.groups.length}, 1fr)` }}
                    >
                      {link.groups.map((group) => (
                        <div key={group.title}>
                          {/* Group heading */}
                          <p className="mb-5 font-mono text-[9px] uppercase tracking-[0.4em] text-gold border-b border-gold/20 pb-2">
                            {group.title}
                          </p>
                          <ul className="flex flex-col gap-0.5">
                            {group.items.map((item) => (
                              <li key={item.label}>
                                <Link
                                  href={item.href}
                                  onClick={closeNow}
                                  className="group flex flex-col gap-0.5 py-2 pr-4 transition-colors"
                                >
                                  <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-text/80 group-hover:text-text transition-colors">
                                    <span
                                      className="h-px w-0 bg-gold transition-all duration-200 group-hover:w-3 shrink-0"
                                      aria-hidden
                                    />
                                    {item.label}
                                  </span>
                                  {item.description && (
                                    <span className="pl-0 font-mono text-[9px] uppercase tracking-[0.15em] text-muted group-hover:text-subtle transition-colors">
                                      {item.description}
                                    </span>
                                  )}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>

                    {/* ── Featured image card ──────────── */}
                    {link.featured && (
                      <Link
                        href={link.featured.href}
                        onClick={closeNow}
                        className="group relative block overflow-hidden rounded-sm"
                        style={{ aspectRatio: "4/5" }}
                      >
                        <Image
                          src={link.featured.image}
                          alt={link.featured.title}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                          sizes="300px"
                        />
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
                        {/* Top-right badge */}
                        {link.featured.badge && (
                          <div className="absolute top-3 left-3">
                            <span className="inline-block font-mono text-[9px] uppercase tracking-[0.35em] text-gold border border-gold/50 bg-black/60 backdrop-blur-sm px-2 py-1">
                              {link.featured.badge}
                            </span>
                          </div>
                        )}
                        {/* Bottom content */}
                        <div className="absolute inset-x-0 bottom-0 p-4">
                          <p className="font-display text-3xl tracking-[0.25em] text-text leading-none">
                            {link.featured.title}
                          </p>
                          {link.featured.subtitle && (
                            <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.25em] text-text/60">
                              {link.featured.subtitle}
                            </p>
                          )}
                          {link.featured.cta && (
                            <p className="mt-4 inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.3em] text-gold group-hover:gap-3 transition-all duration-200">
                              {link.featured.cta}
                              <span aria-hidden>→</span>
                            </p>
                          )}
                        </div>
                        {/* Border glow on hover */}
                        <div className="absolute inset-0 border border-gold/0 group-hover:border-gold/30 transition-colors duration-300 rounded-sm pointer-events-none" />
                      </Link>
                    )}
                  </div>

                  {/* Bottom: view-all link */}
                  <div className="mt-8 pt-5 border-t border-border flex items-center justify-between">
                    <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted">
                      R1P FITNESS — REBORN 1N PARADISE · WAIPAHU, HI
                    </span>
                    <Link
                      href={link.href}
                      onClick={closeNow}
                      className="group flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.3em] text-text/60 hover:text-gold transition-colors"
                    >
                      View all {link.label}
                      <span
                        aria-hidden
                        className="text-gold group-hover:translate-x-1 transition-transform inline-block"
                      >
                        →
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
