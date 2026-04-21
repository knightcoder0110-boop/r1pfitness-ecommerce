import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductGallery, ProductPurchase } from "@/components/product";
import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/ui/price";
import { getCatalog } from "@/lib/catalog";
import { SITE } from "@/lib/constants";
import { productSchema } from "@/lib/seo";

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
  const ldJson = JSON.stringify(productSchema(product, productUrl));

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: ldJson }}
      />

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        <ProductGallery images={product.images} productName={product.name} />

        <div className="flex flex-col gap-8">
          <header className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-1.5">
              {product.meta.isLimited ? <Badge tone="gold">Limited</Badge> : null}
              {onSale ? <Badge tone="coral">Sale</Badge> : null}
              {lowStock ? <Badge tone="neutral">Low stock</Badge> : null}
              {outOfStock ? <Badge tone="danger">Sold out</Badge> : null}
            </div>
            <h1 className="font-display text-4xl tracking-wider text-text sm:text-5xl">
              {product.name}
            </h1>
            <Price
              price={product.price}
              {...(product.compareAtPrice ? { compareAtPrice: product.compareAtPrice } : {})}
              size="lg"
            />
          </header>

          {product.shortDescription ? (
            <p className="font-serif text-lg italic text-text/80">{product.shortDescription}</p>
          ) : null}

          <ProductPurchase product={product} />

          <section
            className="prose prose-invert max-w-none font-serif text-text/80"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />

          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 border-t border-text/10 pt-6 font-mono text-xs uppercase tracking-[0.2em]">
            {product.meta.fitType ? (
              <>
                <dt className="text-text/50">Fit</dt>
                <dd className="text-text">{product.meta.fitType}</dd>
              </>
            ) : null}
            {product.meta.fabricDetails ? (
              <>
                <dt className="text-text/50">Fabric</dt>
                <dd className="text-text">{product.meta.fabricDetails}</dd>
              </>
            ) : null}
            {product.meta.printMethod ? (
              <>
                <dt className="text-text/50">Print</dt>
                <dd className="text-text">{product.meta.printMethod}</dd>
              </>
            ) : null}
            {product.meta.careInstructions ? (
              <>
                <dt className="text-text/50">Care</dt>
                <dd className="text-text">{product.meta.careInstructions}</dd>
              </>
            ) : null}
          </dl>
        </div>
      </div>
    </main>
  );
}
