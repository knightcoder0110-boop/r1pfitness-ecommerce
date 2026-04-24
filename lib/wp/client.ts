import "server-only";

/**
 * WordPress REST API v2 client — read-only.
 *
 * Used to fetch blog posts and pages from the same WordPress install that
 * runs WooCommerce. The WP REST API is public (no auth required for
 * published content).
 *
 * Base URL: WP_BASE_URL env var (e.g. https://woocommerce-1616698-6370177.cloudwaysapps.com)
 * Falls back to WOO_BASE_URL if WP_BASE_URL is not set (they're the same server).
 *
 * Cache strategy:
 *  - Post listings: revalidate every 5 minutes.
 *  - Individual posts: revalidate every 10 minutes.
 *  - On-demand revalidation via WP webhook (add a WP publish webhook pointing
 *    to /api/webhooks/wp/post in Sprint 6+).
 */

const DEFAULT_TIMEOUT_MS = 8_000;

export interface WPPost {
  id: number;
  slug: string;
  status: "publish" | "draft" | "private";
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  date: string;
  modified: string;
  link: string;
  author: number;
  featured_media: number;
  _embedded?: {
    "wp:featuredmedia"?: Array<{
      source_url: string;
      alt_text: string;
      media_details: {
        sizes: {
          medium?: { source_url: string };
          medium_large?: { source_url: string };
          large?: { source_url: string };
          full?: { source_url: string };
        };
      };
    }>;
    author?: Array<{ name: string; avatar_urls: Record<string, string> }>;
  };
}

export interface WPPage {
  id: number;
  slug: string;
  title: { rendered: string };
  content: { rendered: string };
  date: string;
  modified: string;
}

export interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  modified: string;
  featuredImage?: { src: string; alt: string };
  author?: string;
}

export interface BlogListResult {
  posts: BlogPost[];
  total: number;
  totalPages: number;
}

function getBaseUrl(): string {
  const base =
    process.env.WP_BASE_URL ??
    process.env.WOO_BASE_URL ??
    "";
  return base.replace(/\/$/, "");
}

async function wpFetch<T>(
  path: string,
  options: { revalidate?: number } = {},
): Promise<T> {
  const base = getBaseUrl();
  if (!base) {
    throw new Error("WordPress base URL not configured (set WP_BASE_URL)");
  }

  const url = `${base}/wp-json/wp/v2${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: options.revalidate ?? 300 },
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      throw new Error(`WP API error: ${res.status} ${res.statusText} at ${url}`);
    }

    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error(`WP API request timed out: ${url}`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/** Strip HTML tags for plain-text excerpts. */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&[a-z]+;/gi, " ").trim();
}

function mapPost(raw: WPPost): BlogPost {
  const media = raw._embedded?.["wp:featuredmedia"]?.[0];
  const authorName = raw._embedded?.author?.[0]?.name;

  const imageSrc =
    media?.media_details?.sizes?.large?.source_url ??
    media?.media_details?.sizes?.medium_large?.source_url ??
    media?.source_url;

  return {
    id: raw.id,
    slug: raw.slug,
    title: stripHtml(raw.title.rendered),
    excerpt: stripHtml(raw.excerpt.rendered),
    content: raw.content.rendered,
    date: raw.date,
    modified: raw.modified,
    featuredImage: imageSrc
      ? { src: imageSrc, alt: media?.alt_text ?? "" }
      : undefined,
    author: authorName,
  };
}

/**
 * List published blog posts.
 * @param page  1-based page number.
 * @param per   Items per page (max 100 per WP API limits).
 */
export async function listPosts(page = 1, per = 10): Promise<BlogListResult> {
  const base = getBaseUrl();
  if (!base) return { posts: [], total: 0, totalPages: 0 };

  const url = `${base}/wp-json/wp/v2/posts?page=${page}&per_page=${per}&_embed=1&status=publish`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 300 },
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      if (res.status === 404) return { posts: [], total: 0, totalPages: 0 };
      throw new Error(`WP posts error: ${res.status}`);
    }

    const raw = (await res.json()) as WPPost[];
    const total = parseInt(res.headers.get("X-WP-Total") ?? "0", 10);
    const totalPages = parseInt(res.headers.get("X-WP-TotalPages") ?? "1", 10);

    return { posts: raw.map(mapPost), total, totalPages };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetch a single post by slug.
 * Returns null if not found.
 */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const base = getBaseUrl();
  if (!base) return null;

  try {
    const raw = await wpFetch<WPPost[]>(
      `/posts?slug=${encodeURIComponent(slug)}&_embed=1&status=publish`,
      { revalidate: 600 },
    );
    if (!raw.length) return null;
    return mapPost(raw[0]!);
  } catch {
    return null;
  }
}

/**
 * Fetch all published post slugs — used by generateStaticParams.
 * Returns up to 100 slugs (enough for most blogs).
 */
export async function getAllPostSlugs(): Promise<string[]> {
  const base = getBaseUrl();
  if (!base) return [];

  try {
    const raw = await wpFetch<Array<{ slug: string }>>(
      "/posts?per_page=100&status=publish&_fields=slug",
      { revalidate: 3600 },
    );
    return raw.map((p) => p.slug);
  } catch {
    return [];
  }
}
