/**
 * R1P FITNESS — Site Configuration
 * ================================
 * Change ALL your site settings here.
 * No need to touch any other files.
 */

export const siteConfig = {
  // ── Brand ──────────────────────────────────────────────
  brandName: "R1P FITNESS",
  tagline: "REBORN 1N PARADISE",
  address: "94-111 Leokane St, Waipahu, HI 96797",

  // ── Drop Password ─────────────────────────────────────
  // This is checked client-side. For production, set the
  // DROP_PASSWORD env variable instead (takes priority).
  dropPassword: process.env.NEXT_PUBLIC_DROP_PASSWORD || "r1p2026",

  // ── Drop Countdown ────────────────────────────────────
  // Set to an ISO date string, e.g. "2026-05-01T00:00:00"
  // Set to "" or leave NEXT_PUBLIC_NEXT_DROP_DATE empty to HIDE the countdown.
  nextDropDate: process.env.NEXT_PUBLIC_NEXT_DROP_DATE || "",

  // ── Drop Redirect ─────────────────────────────────────
  // Where to send the user after entering the correct password
  dropRedirectUrl: "/drop",

  // ── Marquee Text ──────────────────────────────────────
  marqueeItems: [
    "Reborn 1n Paradise",
    "✦",
    "R1P Fitness",
    "✦",
    "Waipahu, Hawaii",
    "✦",
    "Ohana Forever",
    "✦",
    "Exclusive Drops",
    "✦",
    "24 Hours Only",
  ],

  // ── Manifesto Lines ───────────────────────────────────
  manifestoLines: [
    "HEY OHANA,",
    "WE DROP EXCLUSIVE.",
    "REBORN 1N PARADISE. OHANA FOREVER.",
  ],

  // ── Drop Campaigns ────────────────────────────────────
  // Each campaign gets its own /drop/[slug] page.
  // dropDate: ISO string — when the products go live. If empty, drop is live now.
  // categorySlug: maps to a Woo product category slug shown post-drop.
  // productSlugs: explicit product slugs to feature on the campaign page.
  campaigns: [
    {
      slug: "summer-26",
      name: "SUMMER '26",
      tagline: "The heat is on. Limited run.",
      description:
        "Our first summer drop — built for beach sessions and early morning workouts. 24 hours. No restocks.",
      dropDate: "", // ISO date — e.g. "2026-07-04T12:00:00"
      categorySlug: "tees",
      // Set NEXT_PUBLIC_KLAVIYO_LIST_ID in .env.local → get from Klaviyo → Lists
      klaviyoListId: process.env.NEXT_PUBLIC_KLAVIYO_LIST_ID || "",
      isActive: true,
    },
  ],

  // ── Colors (also reflected in Tailwind / CSS) ─────────
  colors: {
    background: "#0D0D0D",
    text: "#F2EDE4",
    coral: "#C4572A",
    gold: "#C9A84C",
    ocean: "#1B4F6B",
  },
} as const;
