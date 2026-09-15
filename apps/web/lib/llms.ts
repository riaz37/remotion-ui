import type { ReactNode } from "react";
import { getPageMarkdown } from "@/lib/page-markdown";
import { source } from "@/lib/source";
import { siteConfig } from "@/lib/site-config";

type TreeNode = (typeof source.pageTree.children)[number];
type Group = { title: string; urls: string[] };

function label(name: ReactNode, fallback: string): string {
  return typeof name === "string" || typeof name === "number" ? String(name) : fallback;
}

/** Page URLs grouped the way the sidebar shows them: folders, split by separators. */
function sidebarGroups(): Group[] {
  const groups: Group[] = [];
  const push = (title: string, url: string) => {
    // Root pages split by a folder (e.g. ai, mcp after guides) rejoin their group.
    const existing = groups.find((group) => group.title === title);
    if (existing) existing.urls.push(url);
    else groups.push({ title, urls: [url] });
  };

  const walk = (nodes: TreeNode[], folder: string) => {
    let current = folder;
    for (const node of nodes) {
      if (node.type === "separator") {
        current = node.name ? `${folder}: ${label(node.name, "")}` : folder;
      } else if (node.type === "page") {
        push(current, node.url);
      } else if (node.type === "folder") {
        const title = label(node.name, current);
        // Parenthesized group folders nest under the current section.
        const nested = folder === rootTitle ? title : `${folder}: ${title}`;
        if (node.index) push(nested, node.index.url);
        walk(node.children, nested);
      }
    }
  };

  const rootTitle = label(source.pageTree.name, "Documentation");
  walk(source.pageTree.children, rootTitle);
  return groups;
}

function markdownUrl(url: string): string {
  return `${siteConfig.url}${url}.md`;
}

export function buildLlmsTxt(): string {
  const pages = new Map(source.getPages().map((page) => [page.url, page]));
  const seen = new Set<string>();
  const sections: string[] = [];

  const line = (url: string) => {
    const page = pages.get(url);
    if (!page || seen.has(url)) return null;
    seen.add(url);
    const description = page.data.description ? `: ${page.data.description}` : "";
    return `- [${page.data.title}](${markdownUrl(url)})${description}`;
  };

  const addSection = (title: string, urls: string[]) => {
    const lines = urls.map(line).filter(Boolean);
    if (lines.length > 0) sections.push(`## ${title}\n\n${lines.join("\n")}`);
  };

  for (const group of sidebarGroups()) addSection(group.title, group.urls);
  addSection("Other", [...pages.keys()]);

  return `# ${siteConfig.name}

> ${siteConfig.tagline} The npm package is a CLI; components install as editable source in the user's project.

Every docs page is available as Markdown: append \`.md\` to its URL (for example ${siteConfig.url}/docs/components/typewriter.md). The full docs in one file: ${siteConfig.url}/llms-full.txt. Component index as JSON: ${siteConfig.url}/ai/components.json.

Install a component with \`npx remotion-ui@latest add <name>\`, then import it from local source (\`@/remotion/...\`, \`@/compositions/...\`), never from the \`remotion-ui\` package.

${sections.join("\n\n")}
`;
}

export async function buildLlmsFullTxt(): Promise<string> {
  const order = sidebarGroups().flatMap((group) => group.urls);
  const pages = source.getPages();
  const rank = (url: string) => {
    const index = order.indexOf(url);
    return index === -1 ? order.length : index;
  };
  const sorted = [...pages].sort((a, b) => rank(a.url) - rank(b.url));
  const markdown = await Promise.all(sorted.map((page) => getPageMarkdown(page)));
  return `${markdown.join("\n---\n\n")}`;
}
