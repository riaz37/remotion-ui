import { notFound } from "next/navigation";
import { getPageMarkdown } from "@/lib/page-markdown";
import { source } from "@/lib/source";

export const revalidate = false;

export async function GET(
  _request: Request,
  props: { params: Promise<{ slug?: string[] }> },
) {
  const { slug } = await props.params;
  const page = source.getPage(slug);
  if (!page) notFound();

  return new Response(await getPageMarkdown(page), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}

export function generateStaticParams() {
  return source.generateParams();
}
