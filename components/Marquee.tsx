import { siteConfig } from "@/lib/siteConfig";

export default function Marquee() {
  const text = siteConfig.marqueeItems.join(" ");
  // Duplicate for seamless loop
  const doubled = `${text} ${text} ${text} ${text}`;

  return (
    <div className="w-full overflow-hidden border-y border-text/10 py-3">
      <div className="animate-marquee whitespace-nowrap">
        <span className="font-mono text-xs sm:text-sm tracking-[0.3em] uppercase text-text/30">
          {doubled}
        </span>
      </div>
    </div>
  );
}
