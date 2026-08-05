import { source } from "@/lib/source";
import { siteConfig } from "@/lib/site-config";

type DocsPage = NonNullable<ReturnType<typeof source.getPage>>;

function stripFrontmatter(raw: string): string {
  if (!raw.startsWith("---")) return raw.trimStart();
  const end = raw.indexOf("\n---", 3);
  if (end === -1) return raw.trimStart();
  return raw.slice(raw.indexOf("\n", end + 1) + 1).trimStart();
}

/**
 * Renders a docs page as standalone Markdown for LLM consumption: title,
 * description, canonical URL, body, and pointers to the machine-readable
 * endpoints that carry what MDX components render at runtime.
 */
export async function getPageMarkdown(page: DocsPage): Promise<string> {
  const raw = await page.data.getText("raw");
  const url = `${siteConfig.url}${page.url}`;

  const sections = [
    `# ${page.data.title}`,
    page.data.description ? `> ${page.data.description}` : null,
    `Source: ${url}`,
    stripFrontmatter(raw),
  ].filter(Boolean) as string[];

  const componentName = page.url.startsWith("/docs/components/")
    ? page.url.slice("/docs/components/".length)
    : null;

  const pointers = [
    "## Machine-readable references",
    "",
    `- Full RemotionUI guide for LLMs: ${siteConfig.url}/llms-full.txt`,
    `- Component index: ${siteConfig.url}/ai/components.json`,
    componentName && componentName !== "browse"
      ? `- Props and usage for this component: ${siteConfig.url}/ai/components/${componentName}.json`
      : null,
    componentName && componentName !== "browse"
      ? `- Install: \`npx remotion-ui@latest add ${componentName}\``
      : null,
  ].filter(Boolean) as string[];

  sections.push(pointers.join("\n"));

  return `${sections.join("\n\n")}\n`;
}
