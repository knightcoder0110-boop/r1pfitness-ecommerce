import { siteConfig } from "@/lib/siteConfig";

export default function Marquee() {
  const text = siteConfig.marqueeItems.join(" ");
  // Duplicate for seamless loop
  const doubled = `${text} ${text} ${text} ${text}`;

  return (
    <div className="w-full overflow-hidden border-y border-border py-3">
      <div className="animate-marquee whitespace-nowrap">
        <span className="font-mono text-xs sm:text-sm tracking-[0.3em] uppercase text-faint">
          {doubled}
        </span>
      </div>
    </div>
  );
}
