import type { MetadataRoute } from "next";
import { getCatalog, type CatalogDataSource } from "@/lib/catalog";
import { ROUTES } from "@/lib/constants";
import { absoluteUrl } from "@/lib/utils/format";
import { getSiteUrl } from "@/lib/seo/site-url";

export const revalidate = 3600;

async function listAllProducts(catalog: CatalogDataSource) {
  const pageSize = 100;
  const firstPage = await catalog.listProducts({ page: 1, pageSize, sort: "newest" });
  const items = [...firstPage.items];

  for (let page = 2; page <= firstPage.pageCount; page += 1) {
    const result = await catalog.listProducts({ page, pageSize, sort: "newest" });
    items.push(...result.items);
  }

  return items;
}

function toUrl(path: string): string {
  return absoluteUrl(path, getSiteUrl());
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: toUrl(ROUTES.home),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: toUrl(ROUTES.shop),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  try {
    const catalog = getCatalog();
    const [categories, products] = await Promise.all([
      catalog.listCategories(),
      listAllProducts(catalog),
    ]);

    return [
      ...staticRoutes,
      ...categories.map((category) => ({
        url: toUrl(ROUTES.category(category.slug)),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
      ...products.map((product) => ({
        url: toUrl(ROUTES.product(product.slug)),
        lastModified: product.updatedAt ? new Date(product.updatedAt) : undefined,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    ];
  } catch {
    return staticRoutes;
  }
}
