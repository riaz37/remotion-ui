import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/layouts/docs/page";
import { createRelativeLink } from "fumadocs-ui/mdx";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getComponentPageToc } from "@/components/component-page";
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

  // Component pages render their Agent notes / Usage / API Reference / Related
  // headings as JSX inside <ComponentPage>, which fumadocs never sees, so the
  // TOC is synthesized from the same conditions that render those headings.
  const componentName =
    params.slug?.length === 2 && params.slug[0] === "components"
      ? params.slug[1]
      : null;
  // Check the raw MDX: `markdown` has its JSX stripped.
  const rawMdx = componentName ? await page.data.getText("raw") : "";
  const toc =
    componentName && rawMdx.includes("<ComponentPage")
      ? [...page.data.toc, ...getComponentPageToc(componentName)]
      : page.data.toc;

  return (
    <DocsPage toc={toc} full={page.data.full}>
      {faqJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      ) : null}
      <div className="mb-6 flex flex-col items-start justify-between gap-x-6 gap-y-3 sm:flex-row sm:flex-wrap">
        <div className="min-w-0 flex-1">
          <DocsTitle className="text-display-lg font-medium tracking-tight">
            {page.data.title}
          </DocsTitle>
          <DocsDescription className="mb-0">
            {page.data.description}
          </DocsDescription>
        </div>
        <PageAiActions
          markdown={markdown}
          markdownUrl={markdownUrl}
          title={page.data.title}
          className="mt-1 shrink-0"
        />
      </div>
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
  // Served by app/og/docs/[...slug]/route.tsx; the /docs index has no slugs.
  const ogImage = {
    url: `/og/docs/${[...page.slugs, "image.png"].join("/")}`,
    width: 1200,
    height: 630,
    alt: title,
  };

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url: `${siteConfig.url}${page.url}`,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage.url],
    },
    alternates: {
      canonical: `${siteConfig.url}${page.url}`,
    },
  };
}
