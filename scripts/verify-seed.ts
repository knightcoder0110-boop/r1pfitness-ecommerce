/**
 * scripts/verify-seed.ts
 *
 * Compares `.seed-cache/plan.json` against live Woo state and emits
 * `.seed-cache/verify-report.json` with per-product diffs.
 *
 * Usage:
 *   pnpm tsx scripts/verify-seed.ts
 *   pnpm tsx scripts/verify-seed.ts --fix-variations   (create missing variations)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

import { loadEnvLocal } from "./seed/index.ts";
import {
  createWooClient,
  ensureGlobalAttributes,
} from "./seed/woo.ts";
import type { SeedPlan, PlannedProduct } from "./seed/types.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");

interface WooProduct {
  id: number;
  name: string;
  slug: string;
  type: string;
  status: string;
  sku: string;
  images: Array<{ id: number; src: string }>;
  categories: Array<{ id: number; slug: string }>;
  attributes: Array<{ id: number; name: string; slug: string; options: string[]; variation: boolean }>;
  variations: number[];
  meta_data: Array<{ key: string; value: unknown }>;
}

interface WooVariation {
  id: number;
  sku: string;
  attributes: Array<{ id: number; name: string; option: string }>;
  image: { src: string } | null;
}

interface Diff {
  slug: string;
  issues: string[];
}

async function main() {
  loadEnvLocal();
  const wooBaseUrl = process.env.WOO_BASE_URL ?? "";
  const key        = process.env.WOO_CONSUMER_KEY ?? "";
  const secret     = process.env.WOO_CONSUMER_SECRET ?? "";
  if (!wooBaseUrl || !key || !secret) {
    console.error("❌  Missing WOO_* envs");
    process.exit(1);
  }
  const fixVariations = process.argv.includes("--fix-variations");

  const planPath = join(REPO_ROOT, ".seed-cache", "plan.json");
  if (!existsSync(planPath)) {
    console.error("❌  .seed-cache/plan.json missing. Run `pnpm seed:products:plan` first.");
    process.exit(1);
  }
  const plan = JSON.parse(readFileSync(planPath, "utf-8")) as SeedPlan;

  console.log(`🔍  Verifying ${plan.planned.length} planned products against ${wooBaseUrl}\n`);

  const client = createWooClient(wooBaseUrl, key, secret);
  const attrs  = await ensureGlobalAttributes(client);

  // Fetch all Woo products, indexed by slug
  const wooBySlug = new Map<string, WooProduct>();
  let page = 1;
  for (;;) {
    const batch = await client.get<WooProduct[]>(`products?per_page=100&page=${page}&status=any`);
    if (batch.length === 0) break;
    for (const p of batch) wooBySlug.set(p.slug, p);
    if (batch.length < 100) break;
    page++;
  }
  console.log(`    ${wooBySlug.size} products on Woo\n`);

  const diffs: Diff[] = [];
  const stats = {
    missing: 0, typeMismatch: 0, statusMismatch: 0, skuMismatch: 0,
    imageCountMismatch: 0, attributeDiff: 0, variationMissing: 0,
    variationsFixed: 0, ok: 0,
  };

  for (const p of plan.planned) {
    const issues: string[] = [];
    const woo = wooBySlug.get(p.slug);
    if (!woo) {
      issues.push("missing on Woo");
      stats.missing++;
      diffs.push({ slug: p.slug, issues });
      continue;
    }
    if (woo.type !== p.type) { issues.push(`type: plan=${p.type} woo=${woo.type}`); stats.typeMismatch++; }
    if (woo.status !== p.status) { issues.push(`status: plan=${p.status} woo=${woo.status}`); stats.statusMismatch++; }
    if (woo.images.length !== p.images.length) {
      issues.push(`images: plan=${p.images.length} woo=${woo.images.length}`);
      stats.imageCountMismatch++;
    }
    if (p.type === "simple" && p.simplePrice?.sku && woo.sku !== p.simplePrice.sku) {
      issues.push(`sku: plan=${p.simplePrice.sku} woo=${woo.sku}`); stats.skuMismatch++;
    }

    // Attribute parity
    const planAttrSlugs = new Set(p.attributes.map((a) => a.slug));
    const wooAttrSlugs  = new Set(
      woo.attributes.map((a) => (a.slug || (a.name && `pa_${a.name.toLowerCase()}`) || "")),
    );
    for (const s of planAttrSlugs) if (!wooAttrSlugs.has(s)) issues.push(`attr missing: ${s}`);

    // Variation parity
    if (p.type === "variable") {
      const wooVars = await client.get<WooVariation[]>(`products/${woo.id}/variations?per_page=100`);
      const wooSkus = new Set(wooVars.map((v) => v.sku).filter(Boolean));
      const missingSkus = p.variants.filter((v) => !wooSkus.has(v.sku));
      if (missingSkus.length > 0) {
        issues.push(`variations missing: ${missingSkus.length}/${p.variants.length}`);
        stats.variationMissing += missingSkus.length;

        if (fixVariations) {
          const createBodies = missingSkus.map((v) => {
            const varAttrs = v.attributes.map((va) => {
              const handle = attrs.get(va.slug);
              return { id: handle?.id, option: va.option };
            });
            const vb: Record<string, unknown> = {
              sku: v.sku,
              regular_price: v.regular_price,
              manage_stock: v.manage_stock,
              stock_quantity: v.stock_quantity,
              stock_status: v.stock_status,
              attributes: varAttrs,
            };
            if (v.sale_price) vb.sale_price = v.sale_price;
            if (v.image) vb.image = v.image;
            return vb;
          });
          await client.post(
            `products/${woo.id}/variations/batch`,
            { create: createBodies },
            { timeoutMs: 180_000, noRetryOnTimeout: true },
          );
          stats.variationsFixed += createBodies.length;
          console.log(`  🔧  ${p.slug} → created ${createBodies.length} missing variations`);
        }
      }
    }

    if (issues.length === 0) stats.ok++;
    else diffs.push({ slug: p.slug, issues });
  }

  const report = { verifiedAt: new Date().toISOString(), wooBaseUrl, stats, diffs };
  mkdirSync(join(REPO_ROOT, ".seed-cache"), { recursive: true });
  writeFileSync(join(REPO_ROOT, ".seed-cache", "verify-report.json"), JSON.stringify(report, null, 2));

  console.log("\n╔════════════════════════════════════════════════════╗");
  console.log(`║  OK: ${String(stats.ok).padEnd(4)} Missing: ${String(stats.missing).padEnd(4)} AttrDiff: ${String(stats.attributeDiff).padEnd(4)} VarMiss: ${String(stats.variationMissing).padEnd(4)}  ║`);
  console.log("╚════════════════════════════════════════════════════╝");
  console.log(`📝  Wrote report → .seed-cache/verify-report.json`);

  const hasErrors = stats.missing > 0 || stats.typeMismatch > 0 ||
                    stats.statusMismatch > 0 || stats.skuMismatch > 0 ||
                    (stats.variationMissing > 0 && !fixVariations);
  process.exit(hasErrors ? 1 : 0);
}

main().catch((err) => {
  console.error("\n💥  Fatal:", err instanceof Error ? err.message : err);
  process.exit(1);
});
