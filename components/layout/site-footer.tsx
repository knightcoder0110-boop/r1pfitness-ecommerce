import Link from "next/link";
import { Container } from "@/components/ui/container";
import { ROUTES, SITE } from "@/lib/constants";

/** Minimal site footer. Will grow in Phase 7 (newsletter, social, legal). */
export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-20 sm:mt-24 border-t border-border py-10">
      <Container className="flex flex-col items-center gap-3 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-subtle">
          {SITE.address.street}, {SITE.address.city}, {SITE.address.region}{" "}
          {SITE.address.postalCode}
        </p>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
          © {year} {SITE.name}
        </p>
        <nav aria-label="Footer">
          <ul className="mt-1 flex flex-wrap justify-center gap-x-4 gap-y-2 font-mono text-[10px] uppercase tracking-[0.25em] text-subtle">
            <li>
              <Link href={ROUTES.shop} className="transition-colors hover:text-text">
                Shop
              </Link>
            </li>
            <li>
              <a
                href={SITE.social.instagram}
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-text"
              >
                Instagram
              </a>
            </li>
          </ul>
        </nav>
      </Container>
    </footer>
  );
}
