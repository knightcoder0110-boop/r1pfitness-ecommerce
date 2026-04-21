import Link from "next/link";
import { SITE } from "@/lib/constants";

/** Minimal site footer. Will grow in Phase 7 (newsletter, social, legal). */
export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 border-t border-text/10 py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 text-center sm:px-6 lg:px-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-text/40">
          {SITE.address.street}, {SITE.address.city}, {SITE.address.region}{" "}
          {SITE.address.postalCode}
        </p>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-text/25">
          © {year} {SITE.name}
        </p>
        <nav aria-label="Footer">
          <ul className="mt-1 flex gap-4 font-mono text-[10px] uppercase tracking-[0.25em] text-text/40">
            <li>
              <Link href="/shop" className="hover:text-text/70">
                Shop
              </Link>
            </li>
            <li>
              <a
                href={SITE.social.instagram}
                target="_blank"
                rel="noreferrer"
                className="hover:text-text/70"
              >
                Instagram
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
