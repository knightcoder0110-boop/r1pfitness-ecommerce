import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/ui/price";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";
import type { ProductSummary } from "@/lib/woo/types";

export interface ProductCardProps {
  product: ProductSummary;
  /** Loading priority for the image (first row should be eager). */
  priority?: boolean;
  className?: string;
}

/**
 * Grid cell for a product listing. Link-wrapped — keyboard accessible.
 * Dimensions are controlled by the parent grid; the card fills the cell.
 */
export function ProductCard({ product, priority, className }: ProductCardProps) {
  const onSale = product.compareAtPrice && product.compareAtPrice.amount > product.price.amount;
  const outOfStock = product.stockStatus === "out_of_stock";
  const lowStock = product.stockStatus === "low_stock";

  return (
    <Link
      href={ROUTES.product(product.slug)}
      className={cn(
        "group relative flex flex-col gap-3",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        className,
      )}
      aria-label={`${product.name}, ${product.price.currency} ${(product.price.amount / 100).toFixed(2)}`}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-sm bg-text/5">
        {product.image ? (
          <Image
            src={product.image.url}
            alt={product.image.alt || product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            priority={priority}
            className={cn(
              "object-cover transition-transform duration-500",
              !outOfStock && "group-hover:scale-105",
              outOfStock && "opacity-40",
            )}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-text/30 font-mono text-xs">
            NO IMAGE
          </div>
        )}

        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.isLimited ? <Badge tone="gold">Limited</Badge> : null}
          {onSale ? <Badge tone="coral">Sale</Badge> : null}
          {lowStock ? <Badge tone="neutral">Low stock</Badge> : null}
          {outOfStock ? <Badge tone="danger">Sold out</Badge> : null}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="font-display text-lg tracking-wider text-text group-hover:text-gold transition-colors">
          {product.name}
        </h3>
        <Price
          price={product.price}
          {...(product.compareAtPrice ? { compareAtPrice: product.compareAtPrice } : {})}
          size="sm"
        />
      </div>
    </Link>
  );
}
