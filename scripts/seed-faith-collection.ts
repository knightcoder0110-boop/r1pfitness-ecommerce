/**
 * scripts/seed-faith-collection.ts
 *
 * Seeds the 4 "New Faith Collection" vintage tees into WooCommerce.
 * Uploads local product images to the WP media library first, then creates
 * each product with full descriptions, SEO meta, categories, and size variants.
 *
 * Prerequisites — add to .env.local:
 *   WP_USERNAME=<your-wp-admin-username>
 *   WP_APP_PASSWORD=<app-password>
 *
 *   Create one at:  WP Admin → Users → (your user) → Application Passwords → Add New
 *
 * Run:
 *   pnpm seed:faith
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

import { loadEnvLocal } from "./seed/index";
import {
  createWooClient,
  ensureGlobalAttributes,
  ensureAttributeTerms,
  ensureCategoryTree,
  fetchExistingProductSlugs,
  createProduct,
} from "./seed/woo";
import type { PlannedProduct, PlannedVariant } from "./seed/types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT  = join(__dirname, "..");
const IMAGE_DIR  = join(REPO_ROOT, "public/images/products/new-faith-collection");

loadEnvLocal();

const WOO_BASE   = (process.env.WOO_BASE_URL        ?? "").replace(/\/$/, "");
const WOO_KEY    = process.env.WOO_CONSUMER_KEY     ?? "";
const WOO_SECRET = process.env.WOO_CONSUMER_SECRET  ?? "";
const WP_USER    = (process.env.WP_USERNAME           ?? "").trim();
const WP_PASS    = (process.env.WP_APP_PASSWORD      ?? "").replace(/\s+/g, "");

// ── WP media upload ───────────────────────────────────────────────────────────
async function uploadImage(filename: string, altText: string): Promise<string> {
  const filePath = join(IMAGE_DIR, filename);
  if (!existsSync(filePath)) throw new Error(`Image not found: ${filePath}`);

  const fileContent = readFileSync(filePath);
  const wpAuth = "Basic " + Buffer.from(`${WP_USER}:${WP_PASS}`).toString("base64");

  const res = await fetch(`${WOO_BASE}/wp-json/wp/v2/media`, {
    method: "POST",
    headers: {
      Authorization: wpAuth,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": "image/png",
    },
    body: fileContent,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload failed for ${filename}: HTTP ${res.status} — ${text.slice(0, 300)}`);
  }

  const data = await res.json() as { id: number; source_url: string };

  // Patch alt text (separate request — WP ignores it in the initial upload header)
  await fetch(`${WOO_BASE}/wp-json/wp/v2/media/${data.id}`, {
    method: "POST",
    headers: { Authorization: wpAuth, "Content-Type": "application/json" },
    body: JSON.stringify({ alt_text: altText }),
  });

  return data.source_url;
}

// ── Size config ───────────────────────────────────────────────────────────────
const SIZES = [
  { slug: "s",   label: "S",   menuOrder: 2 },
  { slug: "m",   label: "M",   menuOrder: 3 },
  { slug: "l",   label: "L",   menuOrder: 4 },
  { slug: "xl",  label: "XL",  menuOrder: 5 },
  { slug: "2xl", label: "2XL", menuOrder: 6 },
] as const;

function makeSizeAttribute(): PlannedProduct["attributes"][0] {
  return {
    slug: "pa_size",
    name: "Size",
    position: 0,
    visible: true,
    variation: true,
    options:       SIZES.map((s) => s.slug),
    termLabels:    Object.fromEntries(SIZES.map((s) => [s.slug, s.label])),
    termMenuOrder: Object.fromEntries(SIZES.map((s) => [s.slug, s.menuOrder])),
  };
}

function makeVariants(skuPrefix: string): PlannedVariant[] {
  return SIZES.map(({ slug, label }) => ({
    sku:            `${skuPrefix}-${label}`,
    regular_price:  "65.00",
    attributes:     [{ name: "Size", slug: "pa_size", option: slug }],
    stock_quantity: 25,
    stock_status:   "instock" as const,
    manage_stock:   true,
    shopify_opt1:   slug,
    shopify_opt2:   "",
    shopify_opt3:   "",
  }));
}

const FAITH_CATS: PlannedProduct["categories"] = [
  { slug: "tees",        name: "Tees",        parent: "apparel"     },
  { slug: "tops",        name: "Tops",        parent: "apparel"     },
  { slug: "faith",       name: "Faith",       parent: "collections" },
  { slug: "collections", name: "Collections"                        },
];

const FAITH_TAGS = ["faith", "king-of-kings-collection", "limited", "vintage", "heavyweight", "new-faith-collection"];

// ── Product definitions ───────────────────────────────────────────────────────
function buildProducts(urls: Record<string, string>): PlannedProduct[] {
  return [

    // ── 1. Do This In Remembrance — The Last Supper Tee ──────────────────────
    {
      sourceHandle: "do-this-in-remembrance-last-supper-tee",
      slug:         "do-this-in-remembrance-last-supper-vintage-tee-r1pfitness",
      name:         "Do This In Remembrance — Last Supper Tee",
      type:         "variable",
      status:       "publish",

      description: `<p>The night before everything changed, He gathered with His closest disciples, took the bread, and gave thanks.</p>

<p><em>"Take this and eat it. This is my body, given for you. Do this in remembrance of me."</em><br/>— Luke 22:19</p>

<p>This premium heavyweight vintage tee carries that sacred Last Supper scene — screen-printed in bold detail on a rich acid-washed base. Every time you wear it, you carry that covenant forward. Faith isn't just what you believe — it's what you wear, how you move, who you are.</p>

<ul>
  <li>Premium 280gsm heavyweight cotton</li>
  <li>Vintage acid-wash finish</li>
  <li>Oversized relaxed silhouette</li>
  <li>Screen-printed Last Supper artwork</li>
  <li>Cold wash, hang dry</li>
</ul>`,

      short_description: "Luke 22:19 — The Last Supper. 280gsm heavyweight vintage oversized tee. Acid-wash finish. Do this in remembrance of me.",

      categories: FAITH_CATS,
      tags:       FAITH_TAGS,

      images: [
        {
          src: urls["do-this-in-remembrance-last-supper-vintage-tee.png"]!,
          alt: "Do This In Remembrance — Last Supper vintage oversized tee — R1P FITNESS Faith Collection",
        },
      ],

      attributes: [makeSizeAttribute()],
      variants:   makeVariants("R1P-TEE-DOTR"),

      meta: [
        { key: "_yoast_wpseo_title",    value: "Do This In Remembrance — Last Supper Tee | R1P FITNESS" },
        { key: "_yoast_wpseo_metadesc", value: "Luke 22:19 — The Last Supper. Premium heavyweight vintage oversized tee from R1P FITNESS. Faith-inspired streetwear. Limited. Waipahu, Hawaii." },
        { key: "_yoast_wpseo_focuskw",  value: "faith tee R1P FITNESS Last Supper" },
        { key: "_shopify_handle",        value: "do-this-in-remembrance-last-supper-tee" },
        { key: "_r1p_collection",        value: "new-faith-collection" },
      ],

      stock_quantity: 125,
      stock_status:   "instock",
      manage_stock:   true,
    },

    // ── 2. It Is Finished — John 19:30 Crucifixion Tee ───────────────────────
    {
      sourceHandle: "it-is-finished-john-19-30-crucifixion-tee",
      slug:         "it-is-finished-john-19-30-crucifixion-vintage-tee-r1pfitness",
      name:         "It Is Finished — John 19:30 Tee",
      type:         "variable",
      status:       "publish",

      description: `<p>Three words. The most powerful three words ever spoken.</p>

<p>As Jesus hung on the cross — after fulfilling every prophecy, bearing the full weight of sin — He bowed His head and declared:</p>

<p><em>"It is finished."</em><br/>— John 19:30</p>

<p>The debt paid in full. The veil torn from top to bottom. Death losing its sting forever.</p>

<p>This heavyweight vintage tee carries the weight of that moment — the crown of thorns, the nails, the ultimate sacrifice — worn as a daily declaration that you walk in the victory He secured for you. Faith isn't passive. It's worn on your body, lived in your discipline, declared with every rep.</p>

<ul>
  <li>Premium 280gsm heavyweight cotton</li>
  <li>Vintage acid-wash finish</li>
  <li>Oversized relaxed silhouette</li>
  <li>Screen-printed crown of thorns + nails artwork</li>
  <li>Cold wash, hang dry</li>
</ul>`,

      short_description: "John 19:30 — It is finished. 280gsm heavyweight vintage tee. Crown of thorns screen print. Walk in the victory He secured.",

      categories: FAITH_CATS,
      tags:       FAITH_TAGS,

      images: [
        {
          src: urls["it-is-finished-john-19-30-crucifixion-vintage-tee.png"]!,
          alt: "It Is Finished — John 19:30 Crucifixion vintage oversized tee — R1P FITNESS Faith Collection",
        },
      ],

      attributes: [makeSizeAttribute()],
      variants:   makeVariants("R1P-TEE-IIF"),

      meta: [
        { key: "_yoast_wpseo_title",    value: "It Is Finished — John 19:30 Tee | R1P FITNESS" },
        { key: "_yoast_wpseo_metadesc", value: "John 19:30 — It is finished. Premium heavyweight vintage tee. Crown of thorns screen print. R1P FITNESS Faith Collection, Waipahu Hawaii." },
        { key: "_yoast_wpseo_focuskw",  value: "it is finished John 19 30 faith tee" },
        { key: "_shopify_handle",        value: "it-is-finished-john-19-30-crucifixion-tee" },
        { key: "_r1p_collection",        value: "new-faith-collection" },
      ],

      stock_quantity: 125,
      stock_status:   "instock",
      manage_stock:   true,
    },

    // ── 3. A Man After God's Heart — David White Tee ─────────────────────────
    {
      sourceHandle: "man-after-gods-heart-david-white-tee",
      slug:         "man-after-gods-heart-david-white-tee-r1pfitness",
      name:         "A Man After God's Heart — David Tee",
      type:         "variable",
      status:       "publish",

      description: `<p><em>"I have found David son of Jesse, a man after my own heart."</em><br/>— Acts 13:22</p>

<p>David's story was never one of perfection — it was one of heart. He faced Goliath when every trained soldier stood frozen. He danced before the LORD with total, uninhibited abandon. He fell hard, repented completely, and rose again. Because the LORD doesn't measure rank, reputation, or record.</p>

<p><em>"The LORD does not look at the things people look at. People look at the outward appearance, but the LORD looks at the heart."</em><br/>— 1 Samuel 16:7</p>

<p>This crisp white oversized tee tells that full story — shepherd boy on the front, crowned king on the back. Two sides of the same anointed man. Wherever you are right now on your journey, God sees your heart, not your highlight reel.</p>

<ul>
  <li>Premium 280gsm heavyweight cotton</li>
  <li>Clean bright white</li>
  <li>Oversized relaxed silhouette</li>
  <li>Screen-printed dual artwork — shepherd front, king back</li>
  <li>Cold wash, hang dry</li>
</ul>`,

      short_description: "Acts 13:22 / 1 Sam 16:7 — A Man After God's Heart. David tee in white. Shepherd boy front, King of Israel back. 280gsm heavyweight cotton.",

      categories: FAITH_CATS,
      tags:       [...FAITH_TAGS, "white", "david"],

      images: [
        {
          src: urls["david-man-after-gods-heart-white-tee-front.png"]!,
          alt: "A Man After God's Heart — David Tee front — shepherd boy — R1P FITNESS Faith Collection",
        },
        {
          src: urls["david-man-after-gods-heart-white-tee-back.png"]!,
          alt: "A Man After God's Heart — David Tee back — King of Israel — R1P FITNESS Faith Collection",
        },
      ],

      attributes: [makeSizeAttribute()],
      variants:   makeVariants("R1P-TEE-DAVD"),

      meta: [
        { key: "_yoast_wpseo_title",    value: "A Man After God's Heart — David Tee | R1P FITNESS" },
        { key: "_yoast_wpseo_metadesc", value: "Acts 13:22 — Man after God's heart. Oversized white tee — shepherd front, king back. Premium 280gsm cotton. R1P FITNESS Faith Collection." },
        { key: "_yoast_wpseo_focuskw",  value: "David man after God heart tee R1P" },
        { key: "_shopify_handle",        value: "man-after-gods-heart-david-white-tee" },
        { key: "_r1p_collection",        value: "new-faith-collection" },
      ],

      stock_quantity: 125,
      stock_status:   "instock",
      manage_stock:   true,
    },

    // ── 4. Unto Us A Child Is Born — Isaiah 9:6 Nativity Tee ─────────────────
    {
      sourceHandle: "unto-us-a-child-is-born-isaiah-9-6-nativity-tee",
      slug:         "unto-us-a-child-is-born-isaiah-9-6-nativity-tee-r1pfitness",
      name:         "Unto Us A Child Is Born — Isaiah 9:6 Tee",
      type:         "variable",
      status:       "publish",

      description: `<p>Seven hundred years before Bethlehem, the prophet Isaiah wrote these words:</p>

<p><em>"For to us a child is born, to us a son is given, and the government will be on his shoulders. And he will be called Wonderful Counselor, Mighty God, Everlasting Father, Prince of Peace."</em><br/>— Isaiah 9:6</p>

<p>One prophecy. One night. One manger in Bethlehem. One child born under a star who would change the entire course of human history — not just for that generation, but for every generation that would follow.</p>

<p>The Nativity — Mary, Joseph, and the divine light above Bethlehem — is not just a Christmas story. It is the beginning of the greatest story ever told, and it belongs to every season, every day, every moment you choose to believe.</p>

<p>This unisex heavyweight vintage tee carries that sacred night, cut for both men and women of faith who carry that hope 365 days a year.</p>

<ul>
  <li>Premium 280gsm heavyweight cotton</li>
  <li>Vintage wash finish — warm tone</li>
  <li>Unisex oversized silhouette</li>
  <li>Screen-printed nativity scene artwork</li>
  <li>Available in men's and women's fits</li>
  <li>Cold wash, hang dry</li>
</ul>`,

      short_description: "Isaiah 9:6 — Unto us a child is born. Nativity scene screen print. Unisex oversized vintage tee. 280gsm heavyweight cotton. For every season.",

      categories: FAITH_CATS,
      tags:       [...FAITH_TAGS, "nativity", "isaiah", "christmas"],

      images: [
        {
          src: urls["unto-us-isaiah-9-6-nativity-vintage-tee-male.png"]!,
          alt: "Unto Us A Child Is Born — Isaiah 9:6 Nativity Tee male version — R1P FITNESS Faith Collection",
        },
        {
          src: urls["unto-us-isaiah-9-6-nativity-vintage-tee-female.png"]!,
          alt: "Unto Us A Child Is Born — Isaiah 9:6 Nativity Tee female version — R1P FITNESS Faith Collection",
        },
      ],

      attributes: [makeSizeAttribute()],
      variants:   makeVariants("R1P-TEE-UNTO"),

      meta: [
        { key: "_yoast_wpseo_title",    value: "Unto Us A Child Is Born — Isaiah 9:6 Tee | R1P FITNESS" },
        { key: "_yoast_wpseo_metadesc", value: "Isaiah 9:6 — Unto us a child is born. Unisex oversized vintage nativity tee. 280gsm heavyweight cotton. R1P FITNESS Faith Collection, Waipahu Hawaii." },
        { key: "_yoast_wpseo_focuskw",  value: "Isaiah 9 6 nativity faith vintage tee" },
        { key: "_shopify_handle",        value: "unto-us-a-child-is-born-isaiah-9-6-nativity-tee" },
        { key: "_r1p_collection",        value: "new-faith-collection" },
      ],

      stock_quantity: 125,
      stock_status:   "instock",
      manage_stock:   true,
    },

  ];
}

// ── Images to upload ──────────────────────────────────────────────────────────
const IMAGE_ALTS: Record<string, string> = {
  "do-this-in-remembrance-last-supper-vintage-tee.png":    "Do This In Remembrance — Last Supper vintage tee — R1P FITNESS",
  "it-is-finished-john-19-30-crucifixion-vintage-tee.png": "It Is Finished — John 19:30 crucifixion vintage tee — R1P FITNESS",
  "david-man-after-gods-heart-white-tee-front.png":        "A Man After God's Heart — David Tee front — R1P FITNESS",
  "david-man-after-gods-heart-white-tee-back.png":         "A Man After God's Heart — David Tee back — shepherd to king — R1P FITNESS",
  "unto-us-isaiah-9-6-nativity-vintage-tee-male.png":      "Unto Us A Child Is Born — Isaiah 9:6 Nativity Tee (male) — R1P FITNESS",
  "unto-us-isaiah-9-6-nativity-vintage-tee-female.png":    "Unto Us A Child Is Born — Isaiah 9:6 Nativity Tee (female) — R1P FITNESS",
};

// ── Main ──────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  if (!WOO_BASE || !WOO_KEY || !WOO_SECRET) {
    console.error("❌  Missing WOO_BASE_URL / WOO_CONSUMER_KEY / WOO_CONSUMER_SECRET in .env.local");
    process.exit(1);
  }
  if (!WP_USER || !WP_PASS) {
    console.error("❌  Missing WP_USERNAME / WP_APP_PASSWORD in .env.local");
    console.error("    Create one at: WP Admin → Users → (your user) → Application Passwords → Add New");
    process.exit(1);
  }

  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║  R1P FITNESS — New Faith Collection Seed             ║");
  console.log("║  4 products · 6 images · $65 each · S–2XL            ║");
  console.log("╚══════════════════════════════════════════════════════╝\n");

  const client = createWooClient(WOO_BASE, WOO_KEY, WOO_SECRET);

  // ── Step 1: Upload images ─────────────────────────────────────────────────
  console.log("📸  Uploading images to WP media library…");
  const urls: Record<string, string> = {};
  for (const [filename, alt] of Object.entries(IMAGE_ALTS)) {
    process.stdout.write(`    ${filename.padEnd(58)} `);
    const t0 = Date.now();
    const url = await uploadImage(filename, alt);
    urls[filename] = url;
    console.log(`✓  ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  }

  // ── Step 2: Ensure categories ─────────────────────────────────────────────
  console.log("\n⚙️   Ensuring categories…");
  const cats = await ensureCategoryTree(client);
  for (const [slug, h] of cats) {
    console.log(`    ${slug.padEnd(16)} id=${h.id}${h.parent ? ` parent=${h.parent}` : ""}`);
  }

  // ── Step 3: Ensure pa_size terms ─────────────────────────────────────────
  console.log("\n⚙️   Ensuring pa_size terms…");
  const attrs = await ensureGlobalAttributes(client);
  const sizeHandle = attrs.get("pa_size");
  if (!sizeHandle) throw new Error("pa_size attribute not found");
  await ensureAttributeTerms(
    client,
    sizeHandle,
    SIZES.map((s) => ({ slug: s.slug, name: s.label, menu_order: s.menuOrder })),
  );
  console.log(`    pa_size: ${SIZES.map((s) => s.label).join(", ")}`);

  // ── Step 4: Check existing slugs (idempotency) ───────────────────────────
  console.log("\n🔍  Checking for existing slugs…");
  const existing = await fetchExistingProductSlugs(client);

  // ── Step 5: Create products ───────────────────────────────────────────────
  console.log("\n📦  Creating products…\n");
  const products = buildProducts(urls);
  const deps = { client, attrs, cats };

  let created = 0;
  let skipped = 0;
  let failed  = 0;

  for (const [i, p] of products.entries()) {
    const n = `[${i + 1}/${products.length}]`;

    if (existing.has(p.slug)) {
      console.log(`  ⏭  ${n} ${p.slug} — already exists (id=${existing.get(p.slug)!.id})`);
      skipped++;
      continue;
    }

    const t0 = Date.now();
    try {
      const res    = await createProduct(deps, p);
      const secs   = ((Date.now() - t0) / 1000).toFixed(1);
      const vCount = `(${p.variants.length}v)`;
      console.log(`  ✚  ${n} [publish] variable ${p.slug} → id=${res.id} ${vCount} ${secs}s`);
      created++;
    } catch (err) {
      const secs = ((Date.now() - t0) / 1000).toFixed(1);
      const msg  = err instanceof Error ? err.message : String(err);
      console.error(`  ❌  ${n} ${p.slug} ${secs}s: ${msg}`);
      failed++;
    }
  }

  const pad = (n: number) => String(n).padEnd(5);
  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log(`║  Created: ${pad(created)} Skipped: ${pad(skipped)} Failed: ${String(failed).padEnd(6)}║`);
  console.log("╚══════════════════════════════════════════════════════╝\n");

  if (failed > 0) process.exit(1);
}

main().catch((err: unknown) => {
  console.error("\nFatal:", err instanceof Error ? err.message : err);
  process.exit(1);
});
