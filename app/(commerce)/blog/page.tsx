import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Container } from "@/components/ui/container";
import { SITE, ROUTES } from "@/lib/constants";
import { listPosts } from "@/lib/wp/client";
import type { BlogPost } from "@/lib/wp/client";

export const metadata: Metadata = {
  title: `Blog — ${SITE.name}`,
  description: "Training tips, drop announcements, and culture from R1P FITNESS.",
  alternates: { canonical: "/blog" },
};

function PostCard({ post }: { post: BlogPost }) {
  const date = new Date(post.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <article className="group flex flex-col gap-4">
      {post.featuredImage && (
        <Link href={ROUTES.blogPost(post.slug)} className="block overflow-hidden">
          <div className="relative aspect-[16/9] bg-surface-1">
            <Image
              src={post.featuredImage.src}
              alt={post.featuredImage.alt || post.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        </Link>
      )}

      {!post.featuredImage && (
        <Link href={ROUTES.blogPost(post.slug)} className="block overflow-hidden">
          <div className="relative aspect-[16/9] bg-surface-1 flex items-center justify-center">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
              R1P FITNESS
            </span>
          </div>
        </Link>
      )}

      <div className="flex flex-col gap-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">{date}</p>

        <Link href={ROUTES.blogPost(post.slug)}>
          <h2 className="font-serif text-xl text-text transition-colors group-hover:text-accent">
            {post.title}
          </h2>
        </Link>

        {post.excerpt && (
          <p className="line-clamp-3 text-sm leading-relaxed text-text/70">{post.excerpt}</p>
        )}

        <Link
          href={ROUTES.blogPost(post.slug)}
          className="mt-1 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-text transition-opacity hover:opacity-60"
        >
          Read More
          <svg
            aria-hidden="true"
            className="h-3 w-3"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </article>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-6 py-24 text-center">
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">Coming soon</p>
      <h2 className="font-serif text-3xl text-text">No posts yet</h2>
      <p className="max-w-sm text-sm leading-relaxed text-text/70">
        Training tips, drop announcements, and culture are on the way.
      </p>
    </div>
  );
}

export default async function BlogPage() {
  let result;
  try {
    result = await listPosts(1, 12);
  } catch {
    result = { posts: [], total: 0, totalPages: 0 };
  }

  const { posts } = result;

  return (
    <Container className="py-16 sm:py-24">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Blog" }]} />

      <header className="mt-10 mb-12 space-y-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
          {SITE.name}
        </p>
        <h1 className="font-serif text-4xl text-text">Journal</h1>
        <p className="max-w-md text-sm leading-relaxed text-text/70">
          Training philosophy, drop announcements, and behind-the-scenes from the team.
        </p>
      </header>

      {posts.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </Container>
  );
}
