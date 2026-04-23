#!/usr/bin/env tsx
/**
 * scripts/seed-products.ts
 *
 * Thin CLI entry. Delegates to scripts/seed/index.ts.
 *
 * Usage:
 *   pnpm seed:products                       # plan (dry-run) by default
 *   pnpm seed:products --mode=plan           # same as above
 *   pnpm seed:products --mode=seed           # live seed
 *   pnpm seed:products --only=oct-drop       # only handles containing "oct-drop"
 *   pnpm seed:products --limit=3             # limit to first 3 planned products
 *   pnpm seed:products --verbose             # verbose output
 *   pnpm seed:products --include-manifest    # disable exclude-manifest (attempt all)
 */

import { main } from "./seed/index";

main(process.argv.slice(2)).catch((err: unknown) => {
  console.error("\nFatal:", err instanceof Error ? err.message : err);
  if (err instanceof Error && err.stack) console.error(err.stack);
  process.exit(1);
});
