import type { CatalogDataSource } from "./types";
import { createFixtureCatalog } from "./fixture-adapter";

/**
 * Global catalog singleton.
 *
 * Chooses the live Woo adapter when the Woo backend is configured, otherwise
 * falls back to the in-memory fixture adapter. This lets the storefront run
 * fully locally without WordPress, and switch to real data by setting three
 * env vars with zero code changes.
 *
 * The switch intentionally requires all three of
 * `WOO_BASE_URL + WOO_CONSUMER_KEY + WOO_CONSUMER_SECRET`. Store API is
 * public, but admin endpoints (orders, customers) need keys — we insist on a
 * complete Woo config before activating the adapter.
 *
 * We read `process.env` directly here instead of the validated `env` proxy
 * because this file runs in both server and test contexts; the Woo modules
 * themselves still go through `env` for full Zod validation.
 */
import type { createWooCatalog as CreateWooCatalog } from "./woo-adapter";

let instance: CatalogDataSource | undefined;

function isWooConfigured(): boolean {
  return Boolean(
    process.env.WOO_BASE_URL &&
      process.env.WOO_CONSUMER_KEY &&
      process.env.WOO_CONSUMER_SECRET,
  );
}

export function getCatalog(): CatalogDataSource {
  if (instance) return instance;

  if (isWooConfigured()) {
    // Lazy require keeps the Woo adapter (and its `server-only` import) out
    // of the build graph when we're running with fixtures.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createWooCatalog } = require("./woo-adapter") as {
      createWooCatalog: typeof CreateWooCatalog;
    };
    instance = createWooCatalog();
  } else {
    instance = createFixtureCatalog();
  }
  return instance;
}

/** Test-only. Resets the cached instance so tests don't leak state. */
export function __resetCatalogForTests(): void {
  instance = undefined;
}
