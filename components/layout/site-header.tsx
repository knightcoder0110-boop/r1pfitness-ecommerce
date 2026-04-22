import Link from "next/link";
import { CartButton } from "@/components/cart/cart-button";
import { Container } from "@/components/ui/container";
import { ROUTES, SITE } from "@/lib/constants";
import { MobileNav } from "./mobile-nav";
import { DesktopNav, type NavLinkItem } from "./desktop-nav";
import { AccountButton } from "./account-button";
import { AnnouncementBar } from "./announcement-bar";
import { ScrollAwareHeader } from "./scroll-aware-header";
import { SearchButton } from "@/components/search/search-button";

/**
 * Primary nav links. Declared once — both desktop nav and `<MobileNav />`
 * consume the same list so there's no drift.
 *
 * Items with `groups` get a mega-menu on desktop hover.
 */
const NAV_LINKS: NavLinkItem[] = [
  {
    label: "Shop",
    href: ROUTES.shop,
    groups: [
      {
        title: "New",
        items: [
          { label: "New Arrivals",  href: ROUTES.shop,                   description: "Latest releases"       },
          { label: "Best Sellers",  href: ROUTES.shop,                   description: "Community favorites"   },
          { label: "Limited Drops", href: ROUTES.shop,                   description: "While they last"       },
        ],
      },
      {
        title: "Tops",
        items: [
          { label: "Tees",    href: ROUTES.category("tees"),    description: "Graphic & essentials" },
          { label: "Hoodies", href: ROUTES.category("hoodies"), description: "Heavyweight fleece"   },
          { label: "Tanks",   href: ROUTES.category("tanks"),   description: "Training cuts"         },
        ],
      },
      {
        title: "Bottoms & More",
        items: [
          { label: "Bottoms",     href: ROUTES.category("bottoms"),     description: "Shorts & joggers"    },
          { label: "Caps",        href: ROUTES.category("caps"),        description: "Structured fits"     },
          { label: "Accessories", href: ROUTES.category("accessories"), description: "Bags, socks & more"  },
        ],
      },
    ],
    featured: {
      image:    "/images/hero/king-of-kings-collection-cover-image.jpg",
      badge:    "New Collection",
      title:    "KING OF KINGS",
      subtitle: "Limited Edition · Waipahu, HI",
      href:     ROUTES.shop,
      cta:      "Shop the collection",
    },
  },
  { label: "Tees",        href: ROUTES.category("tees")        },
  { label: "Hoodies",     href: ROUTES.category("hoodies")     },
  { label: "Bottoms",     href: ROUTES.category("bottoms")     },
  { label: "Caps",        href: ROUTES.category("caps")        },
  { label: "Accessories", href: ROUTES.category("accessories") },
];

/**
 * Persistent site header. Server component — client behaviour is isolated
 * to `<CartButton />`, `<MobileNav />`, and `<DesktopNav />` at their own
 * boundaries.
 */
export function SiteHeader() {
  return (
    <>
      <AnnouncementBar />
      <ScrollAwareHeader>
        <header
          className="w-full border-b border-border bg-bg/85 backdrop-blur-lg shadow-soft"
          style={{ height: "var(--size-header)" }}
        >
          <Container className="flex h-full items-center justify-between gap-4">
            {/* Left: mobile menu + brand */}
            <div className="flex items-center gap-2">
              <MobileNav links={NAV_LINKS} />
              <Link
                href={ROUTES.home}
                aria-label={`${SITE.name} home`}
                className="group inline-flex flex-col leading-none transition-opacity hover:opacity-90"
              >
                <span className="font-display text-[1.35rem] sm:text-[1.6rem] tracking-[0.22em] text-text">
                  REBORN <span className="text-gold">1N</span> PARADISE
                </span>
                <span className="hidden sm:block font-mono text-[9px] uppercase tracking-[0.55em] text-gold/80 mt-1">
                  R1P · Fitness
                </span>
              </Link>
            </div>

            {/* Desktop nav — includes mega menu */}
            <DesktopNav links={NAV_LINKS} />

            {/* Right: search + account + cart */}
            <div className="flex items-center gap-1">
              <SearchButton />
              <AccountButton />
              <CartButton />
            </div>
          </Container>
        </header>
      </ScrollAwareHeader>
    </>
  );
}
