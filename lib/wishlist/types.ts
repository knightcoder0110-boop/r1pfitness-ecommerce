import type { ImageRef, Money, ProductSummary, StockStatus } from "@/lib/woo/types";

export interface WishlistItem {
  productId: string;
  slug: string;
  name: string;
  price: Money;
  compareAtPrice?: Money;
  image?: ImageRef;
  hoverImage?: ImageRef;
  stockStatus: StockStatus;
  isLimited: boolean;
  colorOptions?: string[];
  sizeOptions?: string[];
  variantCount?: number;
  updatedAt?: string;
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
    ...(product.hoverImage ? { hoverImage: product.hoverImage } : {}),
    stockStatus: product.stockStatus,
    isLimited: product.isLimited,
    ...(product.colorOptions?.length ? { colorOptions: product.colorOptions } : {}),
    ...(product.sizeOptions?.length ? { sizeOptions: product.sizeOptions } : {}),
    ...(product.variantCount ? { variantCount: product.variantCount } : {}),
    ...(product.updatedAt ? { updatedAt: product.updatedAt } : {}),
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
    ...(item.hoverImage ? { hoverImage: item.hoverImage } : {}),
    stockStatus: item.stockStatus,
    isLimited: item.isLimited,
    ...(item.colorOptions?.length ? { colorOptions: item.colorOptions } : {}),
    ...(item.sizeOptions?.length ? { sizeOptions: item.sizeOptions } : {}),
    ...(item.variantCount ? { variantCount: item.variantCount } : {}),
    ...(item.updatedAt ? { updatedAt: item.updatedAt } : {}),
  };
}
