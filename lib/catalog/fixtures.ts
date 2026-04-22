import type { Product, ProductCategory, ProductSummary } from "@/lib/woo/types";

/**
 * Hand-authored sample catalog. Shapes are domain types — no Woo raw payload
 * here. Swap this out for live data by changing the adapter, not the shape.
 *
 * Photos use the existing brand placeholders under /public. Swap with real
 * assets as they come in.
 */

const USD = "USD";

export const FIXTURE_CATEGORIES: ProductCategory[] = [
  { id: "c-tees", name: "Tees", slug: "tees" },
  { id: "c-hoodies", name: "Hoodies", slug: "hoodies" },
  { id: "c-shorts", name: "Shorts", slug: "shorts" },
  { id: "c-accessories", name: "Accessories", slug: "accessories" },
];

import type { ProductAttribute } from "@/lib/woo/types";

const sizeAttr = (): ProductAttribute => ({
  id: "pa_size",
  name: "Size",
  options: ["S", "M", "L", "XL", "XXL"],
  variation: true,
  visible: true,
});

const colorAttr = (options: string[]): ProductAttribute => ({
  id: "pa_color",
  name: "Color",
  options,
  variation: true,
  visible: true,
});

export const FIXTURE_PRODUCTS: Product[] = [
  {
    id: "p-paradise-tee",
    slug: "paradise-tee",
    name: "Paradise Tee",
    description:
      "<p>Heavyweight 240gsm cotton tee with an oversized fit. Discharge-printed hibiscus graphic across the chest.</p>",
    shortDescription: "Heavyweight cotton. Oversized fit. Discharge print.",
    price: { amount: 4800, currency: USD },
    images: [
      { id: "i-1a", url: "/icon.png", alt: "Paradise Tee front" },
      { id: "i-1b", url: "/icon.png", alt: "Paradise Tee back" },
    ],
    categories: [FIXTURE_CATEGORIES[0]!],
    tags: ["hawaii", "heavyweight"],
    attributes: [sizeAttr(), colorAttr(["Bone", "Black"])],
    variations: [],
    stockStatus: "in_stock",
    stockQuantity: 42,
    meta: {
      fitType: "Oversized",
      fabricDetails: "240gsm ringspun cotton",
      printMethod: "Discharge",
      careInstructions: "Cold wash inside out. Hang dry.",
      designStory: "Inspired by early-morning plumeria blooms along Waipahu roads.",
      isLimited: false,
    },
    seo: {},
  },
  {
    id: "p-ohana-hoodie",
    slug: "ohana-hoodie",
    name: "Ohana Heavyweight Hoodie",
    description:
      "<p>450gsm brushed fleece hoodie with drop shoulders. Matte-gold 'OHANA' puff-print across the chest.</p>",
    shortDescription: "450gsm fleece. Drop shoulders. Puff-print chest.",
    price: { amount: 12800, currency: USD },
    compareAtPrice: { amount: 14800, currency: USD },
    images: [
      { id: "i-2a", url: "/icon.png", alt: "Ohana Hoodie front" },
      { id: "i-2b", url: "/icon.png", alt: "Ohana Hoodie back" },
    ],
    categories: [FIXTURE_CATEGORIES[1]!],
    tags: ["heavyweight", "limited"],
    attributes: [sizeAttr(), colorAttr(["Black", "Ocean"])],
    variations: [],
    stockStatus: "low_stock",
    stockQuantity: 3,
    meta: {
      fitType: "Boxy",
      fabricDetails: "450gsm brushed-back fleece",
      printMethod: "Puff print",
      careInstructions: "Cold wash. Tumble low.",
      isLimited: true,
      dropDate: "2026-05-01T00:00:00Z",
    },
    seo: {},
  },
  {
    id: "p-leokane-short",
    slug: "leokane-shorts",
    name: "Leokane Training Shorts",
    description:
      "<p>5\" inseam training short. Four-way stretch with a hidden zip pocket. Built for gym and trail.</p>",
    shortDescription: '5" inseam. Four-way stretch. Zip pocket.',
    price: { amount: 5800, currency: USD },
    images: [{ id: "i-3a", url: "/icon.png", alt: "Leokane Shorts" }],
    categories: [FIXTURE_CATEGORIES[2]!],
    tags: ["training"],
    attributes: [sizeAttr(), colorAttr(["Black", "Coral"])],
    variations: [],
    stockStatus: "in_stock",
    stockQuantity: 60,
    meta: {
      fitType: "Athletic",
      fabricDetails: "88% poly / 12% spandex",
      careInstructions: "Cold wash. Lay flat.",
    },
    seo: {},
  },
  {
    id: "p-reborn-tee",
    slug: "reborn-tee",
    name: "Reborn 1n Paradise Tee",
    description:
      "<p>Midweight 200gsm tee. Bold 'R1P' wordmark on the chest, 'REBORN 1N PARADISE' across the back.</p>",
    shortDescription: "Midweight cotton. Bold wordmark graphic.",
    price: { amount: 3800, currency: USD },
    images: [{ id: "i-4a", url: "/icon.png", alt: "Reborn Tee" }],
    categories: [FIXTURE_CATEGORIES[0]!],
    tags: ["wordmark"],
    attributes: [sizeAttr(), colorAttr(["Black", "Bone", "Coral"])],
    variations: [],
    stockStatus: "in_stock",
    stockQuantity: 120,
    meta: { fitType: "Regular", fabricDetails: "200gsm combed cotton" },
    seo: {},
  },
  {
    id: "p-waipahu-cap",
    slug: "waipahu-cap",
    name: "Waipahu 6-Panel Cap",
    description:
      "<p>Washed cotton twill cap. Low-profile crown. Chain-stitched 'WAIPAHU' callout on the front panel.</p>",
    shortDescription: "Washed twill. Low-profile. Chain-stitch callout.",
    price: { amount: 3400, currency: USD },
    images: [{ id: "i-5a", url: "/icon.png", alt: "Waipahu Cap" }],
    categories: [FIXTURE_CATEGORIES[3]!],
    tags: ["headwear"],
    attributes: [colorAttr(["Bone", "Black", "Ocean"])],
    variations: [],
    stockStatus: "in_stock",
    stockQuantity: 80,
    meta: {},
    seo: {},
  },
  {
    id: "p-gold-rule-hoodie",
    slug: "gold-rule-hoodie",
    name: "Gold Rule Pullover",
    description:
      "<p>Midweight pullover hoodie with tonal stitching and a gold-embroidered minor crest at the left chest.</p>",
    shortDescription: "Midweight pullover. Gold embroidery.",
    price: { amount: 9800, currency: USD },
    images: [{ id: "i-6a", url: "/icon.png", alt: "Gold Rule Pullover" }],
    categories: [FIXTURE_CATEGORIES[1]!],
    tags: ["embroidery", "everyday"],
    attributes: [sizeAttr(), colorAttr(["Ocean", "Black"])],
    variations: [],
    stockStatus: "out_of_stock",
    stockQuantity: 0,
    meta: { fitType: "Regular", fabricDetails: "320gsm cotton-rich fleece" },
    seo: {},
  },
];

/**
 * Keep a stable insertion order that reads as "featured" for the UI.
 */
export function getAllProducts(): Product[] {
  return FIXTURE_PRODUCTS;
}

export function findProductBySlug(slug: string): Product | undefined {
  return FIXTURE_PRODUCTS.find((p) => p.slug === slug);
}

export function findCategoryBySlug(slug: string): ProductCategory | undefined {
  return FIXTURE_CATEGORIES.find((c) => c.slug === slug);
}

export function toSummary(p: Product): ProductSummary {
  const colorAttr = p.attributes.find((a) => /colou?r/i.test(a.name));
  const sizeAttr = p.attributes.find((a) => /^size$/i.test(a.name));
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: p.price,
    ...(p.compareAtPrice ? { compareAtPrice: p.compareAtPrice } : {}),
    ...(p.images[0] ? { image: p.images[0] } : {}),
    ...(p.images[1] ? { hoverImage: p.images[1] } : {}),
    stockStatus: p.stockStatus,
    isLimited: p.meta.isLimited === true,
    ...(colorAttr?.options.length ? { colorOptions: colorAttr.options } : {}),
    ...(sizeAttr?.options.length ? { sizeOptions: sizeAttr.options } : {}),
  };
}
