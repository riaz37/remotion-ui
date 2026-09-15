import { getComponentCategory, type ComponentCategory } from "@/lib/component-categories";
import { getComponentReference } from "@/lib/component-reference";
import { buildComponentMarkdown, buildPageMarkdown } from "@/lib/mdx-to-markdown";
import { source } from "@/lib/source";
import { siteConfig } from "@/lib/site-config";

type DocsPage = NonNullable<ReturnType<typeof source.getPage>>;

const COMPONENT_PREFIX = "/docs/components/";

function componentSlug(url: string): string | null {
  if (!url.startsWith(COMPONENT_PREFIX)) return null;
  const slug = url.slice(COMPONENT_PREFIX.length);
  return slug && slug !== "browse" && !slug.includes("/") ? slug : null;
}

/** The `<CategoryGrid>` cards, as a Markdown link list. */
function categoryItemsMarkdown(category: ComponentCategory): string {
  const lines = category.items.map((item) => {
    const link = `- [${item.title}](${siteConfig.url}${item.url}.md)`;
    return item.description ? `${link}: ${item.description}` : link;
  });
  return `## Components\n\n${lines.join("\n")}\n`;
}

/**
 * Renders a docs page as standalone Markdown for LLM consumption. Component
 * pages are built from `component-reference` data (install, usage, props,
 * related); category landing pages list their group's components; every page
 * has its MDX imports and JSX stripped.
 */
export async function getPageMarkdown(page: DocsPage): Promise<string> {
  const mdx = await page.data.getText("raw");
  const slug = componentSlug(page.url);
  const base = {
    title: page.data.title,
    description: page.data.description,
    url: page.url,
    mdx,
    siteUrl: siteConfig.url,
  };

  if (!slug) return buildPageMarkdown(base);

  // Category landing pages share the /docs/components/<slug> URL space.
  const category = getComponentCategory(source.pageTree, slug);
  if (category) {
    return `${buildPageMarkdown(base)}\n${categoryItemsMarkdown(category)}`;
  }

  return buildComponentMarkdown({
    ...base,
    slug,
    reference: getComponentReference(slug),
    relatedTitle: (related) => source.getPage(["components", related])?.data.title,
  });
}
