/**
 * AnnouncementBar — scrollable gold strip above the site header.
 *
 * Server component. Zero client JS. Pure CSS marquee using an inline
 * @keyframes block so this file is fully self-contained (no globals.css edit).
 * Content is duplicated to create a seamless infinite loop.
 */

const MESSAGES = [
  "24H DROPS ONLY · ONCE IT'S GONE IT'S GONE",
  "FREE SHIPPING ON ORDERS OVER $100",
  "WAIPAHU, HAWAII · EST. 2026",
  "LIMITED EDITION · NEVER RESTOCKED",
  "REBORN 1N PARADISE · R1P FITNESS",
];

export function AnnouncementBar() {
  const track = [...MESSAGES, ...MESSAGES]; // duplicate for seamless loop

  return (
    <div
      role="region"
      aria-label="Site announcements"
      className="relative overflow-hidden bg-[#C9A84C] py-2 select-none"
    >
      <div
        aria-hidden
        className="flex whitespace-nowrap"
        style={{ animation: "r1p-ann-scroll 32s linear infinite" }}
      >
        {track.map((msg, i) => (
          <span
            key={i}
            className="inline-flex shrink-0 items-center gap-3 px-6 font-mono text-[10px] uppercase tracking-[0.4em] text-[#0D0D0D]"
          >
            {msg}
            <span aria-hidden className="opacity-40 text-[8px]">◆</span>
          </span>
        ))}
      </div>

      {/* Visually-hidden live region for screen readers — shows first message only */}
      <p className="sr-only" aria-live="off">
        {MESSAGES[0]}
      </p>

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
