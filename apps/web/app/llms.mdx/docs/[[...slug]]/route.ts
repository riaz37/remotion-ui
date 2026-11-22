import { notFound } from "next/navigation";
import { getPageMarkdown } from "@/lib/page-markdown";
import { source } from "@/lib/source";


export async function GET(
  _request: Request,
  props: { params: Promise<{ slug?: string[] }> },
) {
  const { slug = [] } = await props.params;
  const page = source.getPage(fromStaticSlug(slug));
  if (!page) notFound();

  return new Response(await getPageMarkdown(page), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}

export function generateStaticParams() {
  return source.generateParams().map(({ slug = [] }) => ({ slug: toStaticSlug(slug) }));
}

/**
 * Static export writes one file per param. Without a suffix, /llms.mdx/docs
 * would have to be both a file (the index) and a directory (its children).
 */
function toStaticSlug(slug: string[]): string[] {
  if (slug.length === 0) return ["index.md"];
  return [...slug.slice(0, -1), `${slug.at(-1)}.md`];
}

function fromStaticSlug(slug: string[]): string[] {
  const clean = slug.map((part) => part.replace(/\.md$/, ""));
  return clean.length === 1 && clean[0] === "index" ? [] : clean;
}

export const dynamic = "force-static";
