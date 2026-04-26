import type { Product } from "@/lib/woo/types";

type QuickAddCacheEntry = {
  product?: Product;
  promise?: Promise<Product | null>;
};

const quickAddProductCache = new Map<string, QuickAddCacheEntry>();

function cacheKey(slug: string, productId: string) {
  return `${slug}::${productId}`;
}

async function fetchQuickAddProduct(slug: string, productId: string): Promise<Product | null> {
  const res = await fetch(
    `/api/product/${encodeURIComponent(slug)}?id=${encodeURIComponent(productId)}`,
    { headers: { accept: "application/json" } },
  );
  const json = (await res.json()) as
    | { ok: true; data: Product }
    | { ok: false; error?: { message?: string } };

  if (!res.ok || !json.ok) return null;
  return json.data;
}

export function getCachedQuickAddProduct(slug: string, productId: string) {
  return quickAddProductCache.get(cacheKey(slug, productId))?.product ?? null;
}

export function loadQuickAddProduct(slug: string, productId: string): Promise<Product | null> {
  const key = cacheKey(slug, productId);
  const cached = quickAddProductCache.get(key);

  if (cached?.product) {
    return Promise.resolve(cached.product);
  }

  if (cached?.promise) {
    return cached.promise;
  }

  const promise = fetchQuickAddProduct(slug, productId)
    .then((product) => {
      if (product) {
        quickAddProductCache.set(key, { product });
      } else {
        quickAddProductCache.delete(key);
      }
      return product;
    })
    .catch(() => {
      quickAddProductCache.delete(key);
      return null;
    });

  quickAddProductCache.set(key, { promise });
  return promise;
}