/**
 * scripts/seed/index.ts
 *
 * Orchestrator. Called by the thin entry at `scripts/seed-products.ts`.
 *
 * Modes:
 *   plan   — parse CSV, produce plan.json + skip-report, NO API writes
 *   seed   — plan + idempotent create against Woo
 *   update — re-write known products from the plan (not destructive, PUT/POST variations)  [NOT YET]
 *   resync — plan for all, skip those already live, create missing                         [NOT YET]
 */

import { readFileSync, existsSync, mkdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

import { parseShopifyCsv } from "./csv.ts";
import { filterGroups, splitBeastMode, planProduct, sizeMenuOrder } from "./transforms.ts";
import {
  createWooClient,
  ensureGlobalAttributes,
  ensureAttributeTerms,
  ensureCategoryTree,
  fetchExistingProductSlugs,
  createProduct,
} from "./woo.ts";
import { CATEGORY_TREE } from "./config.ts";
import type { CliOptions, PlannedProduct, SeedPlan, SkippedItem } from "./types.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..");

// ── Env loader ────────────────────────────────────────────────────────────────
export function loadEnvLocal(): void {
  const envPath = join(REPO_ROOT, ".env.local");
  if (!existsSync(envPath)) return;
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 0) continue;
    const key = t.slice(0, eq).trim();
    const val = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}

// ── CLI parsing ───────────────────────────────────────────────────────────────
export function parseCli(argv: string[]): CliOptions {
  const opts: CliOptions = {
    mode: "plan",
    verbose: false,
    includeManifest: false,
    skipImages: false,
  };
  for (const arg of argv) {
    if (arg.startsWith("--mode=")) {
      const m = arg.slice("--mode=".length);
      if (m === "plan" || m === "seed" || m === "update" || m === "resync") opts.mode = m;
    } else if (arg.startsWith("--only=")) {
      opts.only = arg.slice("--only=".length);
    } else if (arg.startsWith("--limit=")) {
      opts.limit = parseInt(arg.slice("--limit=".length), 10);
    } else if (arg === "--verbose" || arg === "-v") {
      opts.verbose = true;
    } else if (arg === "--include-manifest") {
      opts.includeManifest = true;
    } else if (arg === "--skip-images") {
      opts.skipImages = true;
    } else if (arg === "--dry-run") {
      opts.mode = "plan";
    }
  }
  return opts;
}

// ── Build the plan from CSV ───────────────────────────────────────────────────
export function buildPlan(
  csvPath: string,
  opts: CliOptions,
  wooBaseUrl: string,
): { plan: SeedPlan; planned: PlannedProduct[]; skipped: SkippedItem[] } {
  const content = readFileSync(csvPath, "utf-8");
  const rawGroups = parseShopifyCsv(content);

  // Filter → exclude → split Beast Mode
  const filtered = filterGroups(rawGroups, { includeManifest: opts.includeManifest });
  const accepted = splitBeastMode(filtered.accepted);

  // Apply --only filter
  let final = accepted;
  if (opts.only) {
    const needle = opts.only.toLowerCase();
    final = final.filter((g) => g.handle.toLowerCase().includes(needle));
  }
  if (opts.limit && opts.limit > 0) final = final.slice(0, opts.limit);

  // Plan each
  const planned = final.map(planProduct);

  // Roll up attribute terms (unique across planned products)
  const termKey = (tax: string, slug: string) => `${tax}|${slug}`;
  const termRegistry = new Map<string, { taxonomy: string; slug: string; name: string; menu_order?: number }>();
  for (const p of planned) {
    for (const a of p.attributes) {
      for (const [slug, label] of Object.entries(a.termLabels)) {
        const k = termKey(a.slug, slug);
        if (!termRegistry.has(k)) {
          const menu_order = a.termMenuOrder?.[slug];
          termRegistry.set(k, { taxonomy: a.slug, slug, name: label, menu_order });
        }
      }
    }
  }
  // Sizes: ensure canonical menu_order even for sizes not in termMenuOrder
  for (const entry of termRegistry.values()) {
    if (entry.taxonomy === "pa_size" && entry.menu_order === undefined) {
      entry.menu_order = sizeMenuOrder(entry.slug);
    }
  }
  const attributeTerms = [...termRegistry.values()];

  const totalVariants = planned.reduce((n, p) => n + (p.type === "variable" ? p.variants.length : 1), 0);

  const plan: SeedPlan = {
    generatedAt: new Date().toISOString(),
    csvPath,
    wooBaseUrl,
    counts: {
      csvHandles: rawGroups.size,
      toCreate: planned.length,
      skipped: filtered.skipped.length,
      totalVariants,
    },
    planned,
    skipped: filtered.skipped,
    attributeTerms,
    categories: CATEGORY_TREE.map((c) => ({ slug: c.slug, name: c.name, parent: c.parent, description: c.description })),
  };

  return { plan, planned, skipped: filtered.skipped };
}

// ── Entry ─────────────────────────────────────────────────────────────────────
export async function main(argv: string[]): Promise<void> {
  loadEnvLocal();
  const opts = parseCli(argv);

  const csvPath = join(REPO_ROOT, "public/assets/products-files/products_export_new_full.csv");
  const wooBaseUrl = process.env.WOO_BASE_URL ?? "";
  const key        = process.env.WOO_CONSUMER_KEY ?? "";
  const secret     = process.env.WOO_CONSUMER_SECRET ?? "";

  if (opts.mode !== "plan" && (!wooBaseUrl || !key || !secret)) {
    console.error("❌  Missing WOO_BASE_URL / WOO_CONSUMER_KEY / WOO_CONSUMER_SECRET in .env.local");
    process.exit(1);
  }

  banner(opts);

  // 1. Plan
  console.log(`\n📄  Reading CSV: ${csvPath}`);
  const { plan, planned, skipped } = buildPlan(csvPath, opts, wooBaseUrl);

  console.log(`    ${plan.counts.csvHandles} handles in CSV`);
  console.log(`    ${plan.counts.toCreate} products to ${opts.mode === "plan" ? "plan" : "create"}`);
  console.log(`    ${plan.counts.skipped} products skipped`);
  console.log(`    ${plan.counts.totalVariants} total variants`);
  console.log(`    ${plan.attributeTerms.length} unique attribute terms`);

  // Write plan artefact
  const cacheDir = join(REPO_ROOT, ".seed-cache");
  mkdirSync(cacheDir, { recursive: true });
  writeFileSync(join(cacheDir, "plan.json"),        JSON.stringify(plan, null, 2));
  writeFileSync(join(cacheDir, "skipped.json"),     JSON.stringify(skipped, null, 2));
  console.log(`\n📝  Wrote plan → .seed-cache/plan.json`);
  console.log(`📝  Wrote skip report → .seed-cache/skipped.json`);

  if (opts.verbose) {
    console.log("\nSkipped by reason:");
    const byReason: Record<string, number> = {};
    for (const s of skipped) byReason[s.reason] = (byReason[s.reason] ?? 0) + 1;
    for (const [r, n] of Object.entries(byReason)) console.log(`  ${r.padEnd(25)} ${n}`);

    console.log("\nPlanned products (first 15):");
    for (const p of planned.slice(0, 15)) {
      const attrs = p.attributes.map((a) => `${a.slug}(${a.options.length})`).join(" ");
      console.log(`  [${p.status}] ${p.type.padEnd(8)} ${p.slug.slice(0, 38).padEnd(38)} ${attrs}`);
    }
  }

  if (opts.mode === "plan") {
    console.log("\n✅  Plan mode complete — no API calls made.");
    return;
  }

  // 2. Live seed
  console.log("\n🔌  Connecting to WooCommerce…");
  const client = createWooClient(wooBaseUrl, key, secret);

  console.log("\n⚙️   Ensuring global attributes (pa_*)…");
  const attrs = await ensureGlobalAttributes(client);
  for (const [tax, h] of attrs.entries()) console.log(`    ${tax.padEnd(14)} id=${h.id}`);

  // Group terms by taxonomy
  console.log("\n⚙️   Ensuring attribute terms…");
  const termsByTax = new Map<string, Array<{ slug: string; name: string; menu_order?: number }>>();
  for (const t of plan.attributeTerms) {
    const list = termsByTax.get(t.taxonomy) ?? [];
    const entry: { slug: string; name: string; menu_order?: number } = { slug: t.slug, name: t.name };
    if (t.menu_order !== undefined) entry.menu_order = t.menu_order;
    list.push(entry);
    termsByTax.set(t.taxonomy, list);
  }
  for (const [tax, terms] of termsByTax.entries()) {
    const handle = attrs.get(tax);
    if (!handle) continue;
    await ensureAttributeTerms(client, handle, terms);
    console.log(`    ${tax.padEnd(14)} ${handle.termIdBySlug.size} terms`);
  }

  console.log("\n⚙️   Ensuring category tree…");
  const cats = await ensureCategoryTree(client);
  for (const [slug, h] of cats.entries()) console.log(`    ${slug.padEnd(14)} id=${h.id} parent=${h.parent}`);

  console.log("\n🔍  Fetching existing product slugs…");
  const existing = await fetchExistingProductSlugs(client);
  console.log(`    ${existing.size} existing`);

  console.log("\n📦  Creating products…");
  let created = 0, skippedExisting = 0, failed = 0;
  const errors: Array<{ slug: string; message: string }> = [];
  const t0All = Date.now();

  for (let i = 0; i < planned.length; i++) {
    const p = planned[i]!;
    const idx = `[${i + 1}/${planned.length}]`;
    if (existing.has(p.slug)) {
      console.log(`  ⏭  ${idx} ${p.slug} — already exists`);
      skippedExisting++;
      continue;
    }
    const t0 = Date.now();
    try {
      const res = await createProduct({ client, attrs, cats }, p);
      const dt = ((Date.now() - t0) / 1000).toFixed(1);
      const varCount = p.type === "variable" ? p.variants.length : 0;
      console.log(`  ✚  ${idx} [${p.status}] ${p.type.padEnd(8)} ${p.slug} → id=${res.id}${varCount ? ` (${varCount}v)` : ""} ${dt}s`);
      created++;
    } catch (err) {
      const dt = ((Date.now() - t0) / 1000).toFixed(1);
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ❌  ${idx} ${p.slug} ${dt}s: ${msg.slice(0, 180)}`);
      errors.push({ slug: p.slug, message: msg });
      failed++;
    }
  }
  const totalMin = ((Date.now() - t0All) / 60000).toFixed(1);
  console.log(`\n  ⏱   ${totalMin}m total for ${planned.length} products`);

  // Report
  const report = {
    ranAt: new Date().toISOString(),
    mode: opts.mode,
    counts: { created, skippedExisting, failed, plannedTotal: planned.length },
    errors,
  };
  writeFileSync(join(cacheDir, "seed-report.json"), JSON.stringify(report, null, 2));

  console.log("\n╔════════════════════════════════════════════════════╗");
  console.log(`║  Seeded: ${String(created).padEnd(4)} Skipped: ${String(skippedExisting).padEnd(4)} Failed: ${String(failed).padEnd(4)}            ║`);
  console.log("╚════════════════════════════════════════════════════╝");
  if (failed > 0) process.exit(1);
}

function banner(opts: CliOptions): void {
  console.log("\n╔════════════════════════════════════════════════════╗");
  console.log("║  R1P FITNESS — Shopify → WooCommerce seed          ║");
  console.log(`║  mode=${opts.mode.padEnd(7)} only=${(opts.only ?? "-").padEnd(12)} limit=${String(opts.limit ?? "-").padEnd(4)} ║`);
  console.log("╚════════════════════════════════════════════════════╝");
}
