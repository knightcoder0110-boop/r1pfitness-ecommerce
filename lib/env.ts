import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Zod-validated environment variables.
 *
 * - `server`: variables only available in Node.js runtime. Never leaked to the browser.
 * - `client`: variables exposed to the browser. MUST be prefixed with `NEXT_PUBLIC_`.
 * - `runtimeEnv`: explicit mapping so Next.js can statically replace values at build time.
 *
 * Usage:
 *   import { env } from "@/lib/env";
 *   env.KLAVIYO_PRIVATE_API_KEY // server-side
 *   env.NEXT_PUBLIC_SITE_URL    // client or server
 *
 * Add new variables here FIRST, then use them. Variables not declared here are
 * unavailable — this is intentional and prevents typos + silent failures.
 *
 * Phase 0: only variables already in use are required. Everything else is
 * optional and will be required as its integration comes online.
 */
export const env = createEnv({
  server: {
    // Klaviyo (in use today)
    KLAVIYO_PRIVATE_API_KEY: z.string().min(1).optional(),
    KLAVIYO_LIST_ID: z.string().min(1).optional(),

    // WooCommerce (Phase 1+)
    WOO_BASE_URL: z.string().url().optional(),
    WOO_CONSUMER_KEY: z.string().min(1).optional(),
    WOO_CONSUMER_SECRET: z.string().min(1).optional(),
    WOO_WEBHOOK_SECRET: z.string().min(1).optional(),

    // Stripe (Phase 2)
    STRIPE_SECRET_KEY: z.string().min(1).optional(),
    STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),

    // Meilisearch (Phase 3)
    MEILI_HOST: z.string().url().optional(),
    MEILI_MASTER_KEY: z.string().min(1).optional(),
    MEILI_SEARCH_KEY: z.string().min(1).optional(),

    // Auth (Phase 4)
    NEXTAUTH_SECRET: z.string().min(16).optional(),

    // WordPress CMS (Sprint 3)
    WP_BASE_URL: z.string().url().optional(),

    // Contact form
    SUPPORT_EMAIL: z.string().email().optional(),
    KLAVIYO_CONTACT_TEMPLATE_ID: z.string().optional(),

    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  },

  client: {
    NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
    NEXT_PUBLIC_DROP_PASSWORD: z.string().optional(),
    NEXT_PUBLIC_NEXT_DROP_DATE: z.string().optional(),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
    NEXT_PUBLIC_MEILI_SEARCH_KEY: z.string().optional(),
    NEXT_PUBLIC_KLAVIYO_COMPANY_ID: z.string().optional(),
    NEXT_PUBLIC_GTM_ID: z.string().optional(),
    NEXT_PUBLIC_KLAVIYO_LIST_ID: z.string().optional(),
  },

  // Required for Next.js to statically replace NEXT_PUBLIC_* at build time.
  runtimeEnv: {
    KLAVIYO_PRIVATE_API_KEY: process.env.KLAVIYO_PRIVATE_API_KEY,
    KLAVIYO_LIST_ID: process.env.KLAVIYO_LIST_ID,
    WOO_BASE_URL: process.env.WOO_BASE_URL,
    WOO_CONSUMER_KEY: process.env.WOO_CONSUMER_KEY,
    WOO_CONSUMER_SECRET: process.env.WOO_CONSUMER_SECRET,
    WOO_WEBHOOK_SECRET: process.env.WOO_WEBHOOK_SECRET,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    MEILI_HOST: process.env.MEILI_HOST,
    MEILI_MASTER_KEY: process.env.MEILI_MASTER_KEY,
    MEILI_SEARCH_KEY: process.env.MEILI_SEARCH_KEY,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    WP_BASE_URL: process.env.WP_BASE_URL,
    SUPPORT_EMAIL: process.env.SUPPORT_EMAIL,
    KLAVIYO_CONTACT_TEMPLATE_ID: process.env.KLAVIYO_CONTACT_TEMPLATE_ID,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_DROP_PASSWORD: process.env.NEXT_PUBLIC_DROP_PASSWORD,
    NEXT_PUBLIC_NEXT_DROP_DATE: process.env.NEXT_PUBLIC_NEXT_DROP_DATE,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_MEILI_SEARCH_KEY: process.env.NEXT_PUBLIC_MEILI_SEARCH_KEY,
    NEXT_PUBLIC_KLAVIYO_COMPANY_ID: process.env.NEXT_PUBLIC_KLAVIYO_COMPANY_ID,
    NEXT_PUBLIC_GTM_ID: process.env.NEXT_PUBLIC_GTM_ID,
    NEXT_PUBLIC_KLAVIYO_LIST_ID: process.env.NEXT_PUBLIC_KLAVIYO_LIST_ID,
  },

  // Skip validation during builds where env isn't fully populated (e.g. Docker stage).
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",

  // Treat empty strings as undefined so optional vars work with `.env` files.
  emptyStringAsUndefined: true,
});
