import type { CatalogDataSource } from "./types";
import { createFixtureCatalog } from "./fixture-adapter";

/**
 * Global catalog singleton.
 *
 * Today this returns the fixture adapter. When the live Woo integration
 * lands, branch here on `env.WOO_BASE_URL` and return the Woo adapter
 * instead. Nothing else in the codebase changes.
 */
let instance: CatalogDataSource | undefined;

export function getCatalog(): CatalogDataSource {
  if (!instance) instance = createFixtureCatalog();
  return instance;
}

/** Test-only. Resets the cached instance so tests don't leak state. */
export function __resetCatalogForTests(): void {
  instance = undefined;
}
