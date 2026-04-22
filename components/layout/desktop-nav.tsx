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
    closeTimer.current = setTimeout(() => setActiveMenu(null), 140);
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
      {/* ══════════════════════════════════════════════════
          Top-level desktop nav links
          Sizes driven by --nav-link-* tokens in globals.css
          ══════════════════════════════════════════════════ */}
      <nav aria-label="Primary" className="hidden sm:block">
        <ul
          className="flex items-center gap-6 md:gap-8 font-mono uppercase"
          style={{
            fontSize:      "var(--nav-link-size)",
            letterSpacing: "var(--nav-link-tracking)",
            fontWeight:    "var(--nav-link-weight)",
          }}
        >
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
                    "flex items-center gap-1.5 py-1.5 cursor-pointer",
                    "transition-colors duration-(--dur-fast)",
                    "text-text hover:text-gold",
                  )}
                >
                  {link.label}
                  {hasMega && (
                    <ChevronDown
                      className={cn(
                        "h-3 w-3 text-gold/70 transition-transform duration-(--dur-fast)",
                        activeMenu === link.label && "rotate-180 text-gold",
                      )}
                      strokeWidth={2}
                    />
                  )}
                </Link>

                {/* Active / hovered indicator — gold underline */}
                <span
                  aria-hidden
                  className={cn(
                    "absolute -bottom-0.5 left-0 right-0 h-0.5 bg-gold transition-opacity duration-(--dur-fast)",
                    isActive || activeMenu === link.label ? "opacity-100" : "opacity-0",
                  )}
                />
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ══════════════════════════════════════════════════
          Mega menu panel — fixed, full-width, below header
          ══════════════════════════════════════════════════ */}
      <div
        onMouseEnter={cancelClose}
        onMouseLeave={scheduleClose}
        aria-hidden={!hasMegaOpen}
        className={cn(
          "fixed left-0 right-0 z-50 hidden sm:block",
          "transition-[opacity,transform] duration-(--dur-slow) ease-out",
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
                  className="mx-auto px-8 py-12"
                  style={{ maxWidth: "var(--size-container)" }}
                >
                  <div
                    className="grid gap-12"
                    style={{ gridTemplateColumns: link.featured ? "1fr 380px" : "1fr" }}
                  >
                    {/* ── Link columns ──────────────────────── */}
                    <div
                      className="grid gap-10"
                      style={{ gridTemplateColumns: `repeat(${link.groups.length}, 1fr)` }}
                    >
                      {link.groups.map((group) => (
                        <div key={group.title}>
                          {/* Group heading */}
                          <p
                            className="mb-6 pb-3 font-mono uppercase text-gold border-b border-gold/25"
                            style={{
                              fontSize:      "var(--mega-heading-size)",
                              letterSpacing: "var(--mega-heading-tracking)",
                              fontWeight:    600,
                            }}
                          >
                            {group.title}
                          </p>
                          <ul className="flex flex-col gap-1">
                            {group.items.map((item) => (
                              <li key={item.label}>
                                <Link
                                  href={item.href}
                                  onClick={closeNow}
                                  className="group flex flex-col gap-1 py-2.5 pr-4 cursor-pointer"
                                >
                                  {/* Main label */}
                                  <span
                                    className="flex items-center gap-3 font-mono uppercase text-text transition-colors duration-(--dur-fast) group-hover:text-gold"
                                    style={{
                                      fontSize:      "var(--mega-link-size)",
                                      letterSpacing: "var(--mega-link-tracking)",
                                      fontWeight:    "var(--mega-link-weight)",
                                    }}
                                  >
                                    <span
                                      aria-hidden
                                      className="h-0.5 w-0 bg-gold transition-all duration-(--dur-base) group-hover:w-4 shrink-0"
                                    />
                                    {item.label}
                                  </span>

                                  {/* Description */}
                                  {item.description && (
                                    <span
                                      className="pl-7 text-subtle transition-colors duration-(--dur-fast) group-hover:text-muted"
                                      style={{
                                        fontFamily:    "var(--font-serif)",
                                        fontSize:      "var(--mega-desc-size)",
                                        letterSpacing: "var(--mega-desc-tracking)",
                                      }}
                                    >
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

                    {/* ── Featured image card ──────────────────── */}
                    {link.featured && (
                      <Link
                        href={link.featured.href}
                        onClick={closeNow}
                        className="group relative block overflow-hidden rounded-sm cursor-pointer"
                        style={{ aspectRatio: "4 / 5" }}
                      >
                        <Image
                          src={link.featured.image}
                          alt={link.featured.title}
                          fill
                          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                          sizes="380px"
                        />
                        {/* Gradient scrim */}
                        <div
                          aria-hidden
                          className="absolute inset-0 bg-linear-to-t from-black/90 via-black/30 to-black/5"
                        />
                        {/* Badge */}
                        {link.featured.badge && (
                          <div className="absolute top-4 left-4">
                            <span
                              className="inline-block font-mono uppercase text-gold bg-black/70 backdrop-blur-sm border border-gold/60 px-3 py-1.5"
                              style={{
                                fontSize:      "0.6875rem",
                                letterSpacing: "0.35em",
                                fontWeight:    600,
                              }}
                            >
                              {link.featured.badge}
                            </span>
                          </div>
                        )}
                        {/* Bottom content */}
                        <div className="absolute inset-x-0 bottom-0 p-6">
                          <p
                            className="font-display text-text leading-none"
                            style={{
                              fontSize:      "var(--mega-featured-size)",
                              letterSpacing: "0.18em",
                            }}
                          >
                            {link.featured.title}
                          </p>
                          {link.featured.subtitle && (
                            <p
                              className="mt-2 font-mono uppercase text-text/75"
                              style={{
                                fontSize:      "var(--mega-featured-sub)",
                                letterSpacing: "0.2em",
                              }}
                            >
                              {link.featured.subtitle}
                            </p>
                          )}
                          {link.featured.cta && (
                            <p
                              className="mt-5 inline-flex items-center gap-2 font-mono uppercase text-gold group-hover:gap-3 transition-all duration-(--dur-base)"
                              style={{
                                fontSize:      "0.75rem",
                                letterSpacing: "0.28em",
                                fontWeight:    600,
                              }}
                            >
                              {link.featured.cta}
                              <span aria-hidden>→</span>
                            </p>
                          )}
                        </div>
                        {/* Hover border glow */}
                        <div
                          aria-hidden
                          className="absolute inset-0 border border-gold/0 group-hover:border-gold/50 transition-colors duration-(--dur-slow) pointer-events-none"
                        />
                      </Link>
                    )}
                  </div>

                  {/* Bottom strip: tagline + view-all */}
                  <div className="mt-10 pt-6 border-t border-border flex items-center justify-between">
                    <span
                      className="font-mono uppercase text-muted"
                      style={{
                        fontSize:      "0.6875rem",
                        letterSpacing: "0.3em",
                      }}
                    >
                      Reborn 1n Paradise · Waipahu, HI
                    </span>
                    <Link
                      href={link.href}
                      onClick={closeNow}
                      className="group flex items-center gap-2 font-mono uppercase text-text hover:text-gold cursor-pointer transition-colors duration-(--dur-fast)"
                      style={{
                        fontSize:      "0.75rem",
                        letterSpacing: "0.28em",
                        fontWeight:    600,
                      }}
                    >
                      View all {link.label}
                      <span
                        aria-hidden
                        className="text-gold group-hover:translate-x-1 transition-transform duration-(--dur-base) inline-block"
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
