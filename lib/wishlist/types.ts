import type { ImageRef, Money, ProductSummary, StockStatus } from "@/lib/woo/types";

export interface WishlistItem {
  productId: string;
  slug: string;
  name: string;
  price: Money;
  compareAtPrice?: Money;
  image?: ImageRef;
  stockStatus: StockStatus;
  isLimited: boolean;
  addedAt: string;
}

export function wishlistItemFromProductSummary(product: ProductSummary): WishlistItem {
  return {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    ...(product.compareAtPrice ? { compareAtPrice: product.compareAtPrice } : {}),
    ...(product.image ? { image: product.image } : {}),
    stockStatus: product.stockStatus,
    isLimited: product.isLimited,
    addedAt: new Date().toISOString(),
  };
}

export function wishlistItemToProductSummary(item: WishlistItem): ProductSummary {
  return {
    id: item.productId,
    slug: item.slug,
    name: item.name,
    price: item.price,
    ...(item.compareAtPrice ? { compareAtPrice: item.compareAtPrice } : {}),
    ...(item.image ? { image: item.image } : {}),
    stockStatus: item.stockStatus,
    isLimited: item.isLimited,
  };
}
