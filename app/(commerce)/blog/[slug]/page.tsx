import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Container } from "@/components/ui/container";
import { SITE, ROUTES } from "@/lib/constants";
import { getPostBySlug, getAllPostSlugs } from "@/lib/wp/client";

interface Params {
  slug: string;
}

export async function generateStaticParams(): Promise<Params[]> {
  try {
    const slugs = await getAllPostSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: `Not Found — ${SITE.name}`,
    };
  }

  const description = post.excerpt
    ? post.excerpt.slice(0, 155)
    : `Read ${post.title} on the ${SITE.name} journal.`;

  return {
    title: `${post.title} — ${SITE.name}`,
    description,
    alternates: { canonical: ROUTES.blogPost(slug) },
    openGraph: {
      title: post.title,
      description,
      images: post.featuredImage ? [{ url: post.featuredImage.src, alt: post.featuredImage.alt }] : [],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) notFound();

  const date = new Date(post.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Container className="py-16 sm:py-24">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Journal", href: ROUTES.blog },
          { label: post.title },
        ]}
      />

      <article className="mx-auto mt-10 max-w-2xl">
        {/* Hero image */}
        {post.featuredImage && (
          <div className="relative mb-10 aspect-[16/9] overflow-hidden">
            <Image
              src={post.featuredImage.src}
              alt={post.featuredImage.alt || post.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 672px"
              className="object-cover"
            />
          </div>
        )}

        {/* Post header */}
        <header className="mb-10 space-y-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
            {date}
            {post.author && <> &middot; {post.author}</>}
          </p>
          <h1 className="font-serif text-4xl leading-tight text-text">{post.title}</h1>
        </header>

        {/* Post content — trusted WP CMS HTML */}
        <div
          className="prose prose-sm prose-invert max-w-none text-text/80"
          /* eslint-disable-next-line react/no-danger */
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Back link */}
        <div className="mt-16 border-t border-border pt-8">
          <Link
            href={ROUTES.blog}
            className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-text transition-opacity hover:opacity-60"
          >
            <svg
              aria-hidden="true"
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Journal
          </Link>
        </div>
      </article>
    </Container>
  );
}
