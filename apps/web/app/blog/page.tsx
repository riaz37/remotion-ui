import type { Metadata } from "next";
import Link from "next/link";
import { getBlogPosts } from "@/lib/blog";
import { siteConfig } from "@/lib/site-config";

const title = "Blog";
const description =
  "Notes on building video with code: Remotion rendering, motion design, and how the RemotionUI registry is put together.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title: `${title} · ${siteConfig.name}`,
    description,
    type: "website",
    url: `${siteConfig.url}/blog`,
  },
  alternates: {
    canonical: `${siteConfig.url}/blog`,
    types: {
      "application/rss+xml": `${siteConfig.url}/blog/rss.xml`,
    },
  },
};

export default function BlogIndexPage() {
  const posts = getBlogPosts();

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16 sm:py-24">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-display-lg font-medium tracking-tight">
          Blog
        </h1>
        <p className="mt-3 max-w-xl text-fd-muted-foreground">{description}</p>
        <a
          href="/blog/rss.xml"
          className="mt-4 inline-block font-[family-name:var(--font-mono)] text-xs text-fd-muted-foreground underline underline-offset-4 transition-colors hover:text-fd-foreground"
        >
          RSS
        </a>
      </header>

      <ul className="mt-14 flex flex-col divide-y divide-fd-border border-t border-fd-border">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link
              href={`/blog/${post.slug}`}
              className="group flex flex-col gap-2 py-8 transition-opacity hover:opacity-90"
            >
              <time
                dateTime={post.isoDate}
                className="font-[family-name:var(--font-mono)] text-xs text-fd-muted-foreground"
              >
                {post.displayDate}
              </time>
              <h2 className="font-[family-name:var(--font-display)] text-xl font-medium tracking-tight group-hover:underline group-hover:underline-offset-4">
                {post.title}
              </h2>
              <p className="text-sm text-fd-muted-foreground">
                {post.description}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      {posts.length === 0 ? (
        <p className="mt-14 text-sm text-fd-muted-foreground">
          Nothing published yet.
        </p>
      ) : null}
    </div>
  );
}
