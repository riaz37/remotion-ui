import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/layouts/docs/page";
import { createRelativeLink } from "fumadocs-ui/mdx";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageAiActions } from "@/components/docs/page-ai-actions";
import { getMDXComponents } from "@/mdx-components";
import { getPageMarkdown } from "@/lib/page-markdown";
import { source } from "@/lib/source";
import { siteConfig } from "@/lib/site-config";
import { faqPageJsonLd, docsFaqJsonLdBySlug } from "@/lib/site-metadata";

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const slugKey = (params.slug ?? []).join("/");
  const faqEntries = docsFaqJsonLdBySlug[slugKey];
  const faqJsonLd = faqEntries ? faqPageJsonLd(faqEntries) : null;
  const markdown = await getPageMarkdown(page);
  const markdownUrl = `${siteConfig.url}/llms.mdx${page.url}`;

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      {faqJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      ) : null}
      <DocsTitle className="text-display-lg font-medium tracking-tight">
        {page.data.title}
      </DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <PageAiActions
        markdown={markdown}
        markdownUrl={markdownUrl}
        title={page.data.title}
      />
      <DocsBody>
        <MDX
          components={getMDXComponents({
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: {
  params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const title = page.data.title;
  const description = page.data.description;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url: `${siteConfig.url}${page.url}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: `${siteConfig.url}${page.url}`,
    },
  };
}
