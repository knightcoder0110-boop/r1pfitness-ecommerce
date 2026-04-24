/**
 * Application-wide constants.
 *
 * Site identity, brand tokens, and UX defaults. Anything that's truly static
 * and referenced from multiple places belongs here. Content that changes with
 * campaigns lives in `lib/siteConfig.ts` or CMS.
 */

export const SITE = {
  name: "R1P FITNESS",
  legalName: "R1P Fitness",
  tagline: "REBORN 1N PARADISE",
  defaultTitle: "R1P FITNESS — REBORN 1N PARADISE",
  defaultDescription:
    "Exclusive Hawaiian streetwear & fitness apparel. Limited drops, 24 hours only. Waipahu, HI.",
  defaultOgImage: "/og-default.png",
  locale: "en_US",
  currency: "USD",
  address: {
    street: "94-111 Leokane St",
    city: "Waipahu",
    region: "HI",
    postalCode: "96797",
    country: "US",
  },
  social: {
    instagram: "https://instagram.com/r1pfitness",
  },
} as const;

/**
 * Brand color tokens. These must match CSS variables in `globals.css`.
 * Keep in sync when either changes.
 */
export const COLORS = {
  bg: "#0D0D0D",
  text: "#F2EDE4",
  coral: "#C4572A",
  gold: "#C9A84C",
  ocean: "#1B4F6B",
} as const;

/**
 * Cache tags used with Next.js `revalidateTag`.
 * Centralize here so we don't scatter magic strings.
 */
export const CACHE_TAGS = {
  products: "products",
  product: (slug: string) => `product:${slug}`,
  category: (slug: string) => `category:${slug}`,
  cmsPage: (slug: string) => `cms:page:${slug}`,
  cmsHome: "cms:home",
  cmsDrop: (slug: string) => `cms:drop:${slug}`,
} as const;

/**
 * Route constants. Never hard-code paths in components — import from here
 * so renames happen in one place.
 */
export const ROUTES = {
  home: "/",
  shop: "/shop",
  product: (slug: string) => `/product/${slug}`,
  category: (slug: string) => `/shop/${slug}`,
  cart: "/cart",
  checkout: "/checkout",
  checkoutConfirmation: (orderId: string) => `/checkout/confirmation/${orderId}`,
  account: "/account",
  accountOrders: "/account/orders",
  accountOrder: (id: string) => `/account/orders/${id}`,
  accountAddresses: "/account/addresses",
  login: "/account/login",
  register: "/account/register",
  drop: (campaign: string) => `/drop/${campaign}`,
  search: "/search",
  about: "/about",
  collections: "/collections",
  forgotPassword: "/account/forgot-password",
  blog: "/blog",
  blogPost: (slug: string) => `/blog/${slug}`,
  contact: "/contact",
  privacy: "/privacy",
  terms: "/terms",
  shipping: "/shipping",
  returns: "/returns",
  faq: "/faq",
} as const;
