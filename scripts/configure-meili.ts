#!/usr/bin/env tsx
/**
 * scripts/configure-meili.ts
 *
 * Apply index settings to Meilisearch. Run once after provisioning,
 * or whenever MEILI_INDEX_SETTINGS change.
 *
 * Usage:
 *   pnpm tsx scripts/configure-meili.ts
 *
 * Requires:
 *   MEILI_HOST=https://your-meili-instance.ms.meilisearch.io
 *   MEILI_MASTER_KEY=<your master key>
 */

import "dotenv/config";
import { getMeiliAdmin, MEILI_INDEX, MEILI_INDEX_SETTINGS } from "../lib/search/meilisearch";

async function main() {
  console.log(`Configuring Meilisearch index: ${MEILI_INDEX}`);
  const client = getMeiliAdmin();

  // Create the index if it doesn't exist yet.
  try {
    await client.createIndex(MEILI_INDEX, { primaryKey: "id" });
    console.log("  ✓ Index created");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("already exists") || msg.includes("index_already_exists")) {
      console.log("  ~ Index already exists, updating settings...");
    } else {
      throw err;
    }
  }

  const index = client.index(MEILI_INDEX);
  const task = await index.updateSettings(MEILI_INDEX_SETTINGS);
  console.log(`  ✓ Settings update enqueued (taskUid: ${task.taskUid})`);

  // Wait for settings to apply.
  await client.tasks.waitForTask(task.taskUid, { timeout: 30_000 });
  console.log("  ✓ Settings applied");
  console.log("Done. Run `pnpm tsx scripts/reindex-meili.ts` to populate the index.");
}

main().catch((err) => {
  console.error("configure-meili failed:", err);
  process.exit(1);
});
