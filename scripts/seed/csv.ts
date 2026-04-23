/**
 * scripts/seed/csv.ts
 *
 * CSV parsing + handle-grouping for the Shopify export.
 *
 * Uses RFC-4180 parsing (handles multi-line quoted HTML bodies) and
 * header-name field access (robust against column re-ordering).
 */

import type { CsvRow, ProductGroup, RawVariant, ShopifyMetafields } from "./types.ts";
import { METAFIELD_COLUMN_MAP } from "./config.ts";

// ── Low-level RFC-4180 parser ─────────────────────────────────────────────────
export function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  const row: string[] = [];
  let field = "";
  let inQuote = false;
  let i = 0;

  const push = () => { row.push(field); field = ""; };
  const flush = () => { push(); rows.push([...row]); row.length = 0; };

  while (i < content.length) {
    const ch = content[i]!;
    if (inQuote) {
      if (ch === '"' && content[i + 1] === '"') { field += '"'; i += 2; }
      else if (ch === '"') { inQuote = false; i++; }
      else { field += ch; i++; }
    } else {
      if (ch === '"') { inQuote = true; i++; }
      else if (ch === ",") { push(); i++; }
      else if (ch === "\r") { i++; }
      else if (ch === "\n") { flush(); i++; }
      else { field += ch; i++; }
    }
  }
  if (field.length > 0 || row.length > 0) flush();
  return rows;
}

// ── Row → header-keyed object ────────────────────────────────────────────────
export function rowsToObjects(raw: string[][]): CsvRow[] {
  const header = raw[0];
  if (!header) return [];
  const out: CsvRow[] = [];
  for (let i = 1; i < raw.length; i++) {
    const r = raw[i]!;
    const obj: Record<string, string> = {};
    for (let j = 0; j < header.length; j++) {
      obj[header[j]!] = r[j] ?? "";
    }
    out.push(Object.freeze(obj));
  }
  return out;
}

// ── Header lookup helpers ────────────────────────────────────────────────────
const REQUIRED_HEADERS = [
  "Handle", "Title", "Body (HTML)", "Vendor", "Product Category", "Type",
  "Tags", "Published",
  "Option1 Name", "Option1 Value",
  "Option2 Name", "Option2 Value",
  "Option3 Name", "Option3 Value",
  "Variant SKU", "Variant Price", "Variant Compare At Price",
  "Image Src", "Image Position", "Image Alt Text",
  "SEO Title", "SEO Description",
  "Variant Image", "Status",
] as const;

export function validateHeaders(header: string[]): void {
  const missing = REQUIRED_HEADERS.filter((h) => !header.includes(h));
  if (missing.length > 0) {
    throw new Error(`CSV is missing required headers: ${missing.join(", ")}`);
  }
}

// ── Metafield harvester ──────────────────────────────────────────────────────
function harvestMetafields(firstRowOfGroup: CsvRow): ShopifyMetafields {
  const mf: ShopifyMetafields = {};
  for (const col of Object.keys(firstRowOfGroup)) {
    const value = firstRowOfGroup[col]?.trim();
    if (!value) continue;
    for (const { match, key } of METAFIELD_COLUMN_MAP) {
      if (match.test(col)) {
        // Only assign first match; metafield cells for a product are the same across all rows.
        if (!mf[key]) mf[key] = value;
        break;
      }
    }
  }
  return mf;
}

// ── Variant parser ────────────────────────────────────────────────────────────
function parseVariant(row: CsvRow): RawVariant | null {
  const opt1 = row["Option1 Value"] ?? "";
  // Must have at least opt1 to be a variant-bearing row (image-only rows lack it)
  if (!opt1) return null;
  return {
    opt1,
    opt2: row["Option2 Value"] ?? "",
    opt3: row["Option3 Value"] ?? "",
    price:             row["Variant Price"] ?? "",
    compareAt:         row["Variant Compare At Price"] ?? "",
    sku:               row["Variant SKU"] ?? "",
    barcode:           row["Variant Barcode"] ?? "",
    weightGrams:       row["Variant Grams"] ?? "",
    requiresShipping: (row["Variant Requires Shipping"] ?? "true").toLowerCase() !== "false",
    taxable:          (row["Variant Taxable"]           ?? "true").toLowerCase() !== "false",
    variantImage:      row["Variant Image"] ?? "",
  };
}

// ── Group rows by Handle into ProductGroups ──────────────────────────────────
export function groupRows(objects: CsvRow[]): Map<string, ProductGroup> {
  const map = new Map<string, ProductGroup>();

  for (const row of objects) {
    const handle = row["Handle"];
    if (!handle) continue;

    let g = map.get(handle);
    if (!g) {
      g = {
        handle,
        title:           row["Title"] ?? "",
        bodyHtml:        row["Body (HTML)"] ?? "",
        vendor:          row["Vendor"] ?? "",
        productCategory: row["Product Category"] ?? "",
        type:            row["Type"] ?? "",
        tags:            row["Tags"] ?? "",
        published:      (row["Published"] ?? "").toLowerCase() === "true",
        status:          row["Status"] ?? "",
        opt1Name:        row["Option1 Name"] ?? "",
        opt2Name:        row["Option2 Name"] ?? "",
        opt3Name:        row["Option3 Name"] ?? "",
        seoTitle:        row["SEO Title"] ?? "",
        seoDescription:  row["SEO Description"] ?? "",
        images:          [],
        variants:        [],
        metafields:      harvestMetafields(row),
      };
      map.set(handle, g);
    }

    // Image
    const imgSrc = row["Image Src"];
    if (imgSrc && !g.images.some((i) => i.src === imgSrc)) {
      const pos = parseInt(row["Image Position"] ?? "", 10);
      g.images.push({
        src: imgSrc,
        pos: Number.isFinite(pos) ? pos : 99,
        alt: row["Image Alt Text"] ?? "",
      });
    }

    // Variant
    const v = parseVariant(row);
    if (v) g.variants.push(v);
  }

  // Sort images by position for each group
  for (const g of map.values()) {
    g.images.sort((a, b) => a.pos - b.pos);
  }
  return map;
}

// ── Top-level entry ───────────────────────────────────────────────────────────
export function parseShopifyCsv(content: string): Map<string, ProductGroup> {
  const raw = parseCsv(content);
  const header = raw[0];
  if (!header) throw new Error("CSV is empty");
  validateHeaders(header);
  return groupRows(rowsToObjects(raw));
}
