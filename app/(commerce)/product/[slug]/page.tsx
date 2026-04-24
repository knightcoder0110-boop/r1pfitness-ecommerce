import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductGallery, ProductPurchase, RelatedProducts } from "@/components/product";
import { ProductAddons } from "@/components/product/product-addons";
import { DescriptionReadMore } from "@/components/product/description-read-more";
import { ShareButton } from "@/components/product/share-button";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Price } from "@/components/ui/price";
import { getCatalog } from "@/lib/catalog";
import { ROUTES, SITE } from "@/lib/constants";
import { productSchema, breadcrumbSchema } from "@/lib/seo";
import { getSiteUrl } from "@/lib/seo/site-url";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const { items } = await getCatalog().listProducts({ pageSize: 100 });
  return items.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getCatalog().getProductBySlug(slug);
  if (!product) return { title: "Not Found" };

  const canonical = `/product/${product.slug}`;
  const ogImage = product.images[0]?.url;
  return {
    title: product.name,
    description: product.shortDescription || product.name,
    alternates: { canonical },
    openGraph: {
      title: `${product.name} — ${SITE.name}`,
      description: product.shortDescription || product.name,
      url: canonical,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getCatalog().getProductBySlug(slug);
  if (!product) notFound();

  const outOfStock = product.stockStatus === "out_of_stock";
  const lowStock = product.stockStatus === "low_stock";
  const onSale =
    product.compareAtPrice && product.compareAtPrice.amount > product.price.amount;

  const productUrl = `/product/${product.slug}`;
  const siteUrl = getSiteUrl();
  const ldJson = JSON.stringify(productSchema(product, `${siteUrl}${productUrl}`));

  // Primary category for breadcrumb trail (first non-uncategorized match).
  const primaryCategory = product.categories.find(
    (c) => c.slug !== "uncategorized",
  );

  const breadcrumbItems = [
    { label: "Shop", href: ROUTES.shop },
    ...(primaryCategory
      ? [{ label: primaryCategory.name, href: ROUTES.category(primaryCategory.slug) }]
      : []),
    { label: product.name },
  ];

  const breadcrumbLd = JSON.stringify(
    breadcrumbSchema(
      breadcrumbItems.map((item) => ({
        name: item.label,
        url: item.href ? `${siteUrl}${item.href}` : undefined,
      }))
    )
  );

  return (
    <Container as="main" className="py-8 sm:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: ldJson }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: breadcrumbLd }}
      />

      <Breadcrumbs items={breadcrumbItems} className="mb-6 sm:mb-8" />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-14 xl:gap-20 lg:items-start">
        {/* ── Left: gallery — sticky on desktop until right col ends ── */}
        <div className="lg:sticky lg:top-[calc(var(--size-header)+1.5rem)] lg:self-start">
          <ProductGallery images={product.images} productName={product.name} />
        </div>

        {/* ── Right: product info ── */}
        <div className="flex flex-col gap-6 sm:gap-7">
          {/* Badges */}
          {(product.meta.isLimited || onSale || lowStock || outOfStock) && (
            <div className="flex flex-wrap gap-1.5">
              {product.meta.isLimited ? <Badge tone="gold">Limited</Badge> : null}
              {onSale ? <Badge tone="coral">Sale</Badge> : null}
              {lowStock ? <Badge tone="neutral">Low stock</Badge> : null}
              {outOfStock ? <Badge tone="danger">Sold out</Badge> : null}
            </div>
          )}

          {/* Title row — title + share button */}
          <div className="flex items-start justify-between gap-4">
            <Heading level={1} size="xl" className="text-3xl sm:text-4xl lg:text-5xl">
              {product.name}
            </Heading>
            <ShareButton
              title={product.name}
              text={product.shortDescription || undefined}
            />
          </div>

          {/* Price */}
          <Price
            price={product.price}
            {...(product.compareAtPrice ? { compareAtPrice: product.compareAtPrice } : {})}
            size="lg"
          />

          {/* Short description */}
          {product.shortDescription ? (
            <div
              className="font-serif text-base sm:text-lg italic text-muted [&_p]:mb-0"
              dangerouslySetInnerHTML={{ __html: product.shortDescription }}
            />
          ) : null}

          {/* Divider */}
          <hr className="border-border" />

          {/* Complete the Look — add-on products */}
          <ProductAddons currentProduct={product} />

          {/* Purchase — scarcity + variants + qty + ATC + trust strip (inside) */}
          <ProductPurchase product={product} />

          {/* Description accordion */}
          {product.description ? (
            <DescriptionReadMore html={product.description} />
          ) : null}

          {/* Product specs */}
          {(product.meta.fitType ||
            product.meta.fabricDetails ||
            product.meta.printMethod ||
            product.meta.careInstructions) && (
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 border-t border-border pt-6 font-mono text-xs uppercase tracking-[0.2em]">
              {product.meta.fitType ? (
                <>
                  <dt className="text-muted">Fit</dt>
                  <dd className="text-text">{product.meta.fitType}</dd>
                </>
              ) : null}
              {product.meta.fabricDetails ? (
                <>
                  <dt className="text-muted">Fabric</dt>
                  <dd className="text-text">{product.meta.fabricDetails}</dd>
                </>
              ) : null}
              {product.meta.printMethod ? (
                <>
                  <dt className="text-muted">Print</dt>
                  <dd className="text-text">{product.meta.printMethod}</dd>
                </>
              ) : null}
              {product.meta.careInstructions ? (
                <>
                  <dt className="text-muted">Care</dt>
                  <dd className="text-text">{product.meta.careInstructions}</dd>
                </>
              ) : null}
            </dl>
          )}
        </div>
      </div>

      <RelatedProducts current={product} />
    </Container>
  );
}

