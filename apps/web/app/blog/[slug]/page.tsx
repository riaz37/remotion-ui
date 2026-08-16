import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogPost, getBlogPosts } from "@/lib/blog";
import { getMDXComponents } from "@/mdx-components";
import { siteConfig } from "@/lib/site-config";
import { siteMetadata } from "@/lib/site-metadata";

export default async function BlogPostPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const MDX = post.entry.body;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.isoDate,
    dateModified: post.isoDate,
    author: { "@type": "Organization", name: post.author },
    publisher: { "@type": "Organization", name: siteConfig.name },
    mainEntityOfPage: `${siteConfig.url}/blog/${post.slug}`,
    image: siteMetadata.ogImage,
  };

  return (
    <article className="mx-auto w-full max-w-3xl px-6 py-16 sm:py-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Link
        href="/blog"
        className="font-[family-name:var(--font-mono)] text-xs text-fd-muted-foreground transition-colors hover:text-fd-foreground"
      >
        ← Blog
      </Link>

      <header className="mt-8">
        <h1 className="font-[family-name:var(--font-display)] text-display-lg font-medium tracking-tight">
          {post.title}
        </h1>
        <p className="mt-3 text-fd-muted-foreground">{post.description}</p>
        <p className="mt-6 font-[family-name:var(--font-mono)] text-xs text-fd-muted-foreground">
          <time dateTime={post.isoDate}>{post.displayDate}</time>
          <span aria-hidden> · </span>
          {post.author}
        </p>
      </header>

      <div className="prose mt-12 max-w-none">
        <MDX components={getMDXComponents()} />
      </div>
    </article>
  );
}

export function generateStaticParams() {
  return getBlogPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const url = `${siteConfig.url}/blog/${post.slug}`;

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      siteName: siteConfig.name,
      publishedTime: post.isoDate,
      authors: [post.author],
      tags: post.tags,
      url,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
    alternates: {
      canonical: url,
    },
  };
}
