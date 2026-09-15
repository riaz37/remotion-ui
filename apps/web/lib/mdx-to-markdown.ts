import type { ComponentReference } from "@/lib/component-reference";

/**
 * Pure MDX -> Markdown conversion for the LLM surface (`.md` pages, llms-full.txt).
 * No fumadocs imports here, so it runs in vitest without the generated collections.
 */

const CLI = "npx remotion-ui@latest";

export function stripFrontmatter(raw: string): string {
  if (!raw.startsWith("---")) return raw.trimStart();
  const end = raw.indexOf("\n---", 3);
  if (end === -1) return raw.trimStart();
  return raw.slice(raw.indexOf("\n", end + 1) + 1).trimStart();
}

function attr(tag: string, name: string): string | undefined {
  const match = tag.match(new RegExp(`\\b${name}=(?:"([^"]*)"|'([^']*)')`));
  return match ? (match[1] ?? match[2]) : undefined;
}

function fence(code: string, lang = ""): string {
  return `\`\`\`${lang}\n${code.trim()}\n\`\`\``;
}

export function toMarkdownUrl(url: string): string {
  if (url.startsWith("/docs") && !url.includes("#") && !url.endsWith(".md")) {
    return `${url.replace(/\/$/, "")}.md`;
  }
  return url;
}

/** `](/docs/x)` -> `](https://site/docs/x.md)` so links work outside the site. */
function absolutizeDocsLinks(line: string, siteUrl: string): string {
  return line.replace(
    /\]\((\/docs[^)\s#]*)(#[^)\s]*)?\)/g,
    (_m, url: string) => `](${siteUrl}${toMarkdownUrl(url)})`,
  );
}

function snippetLang(label: string | undefined, code: string): string {
  if (label?.endsWith(".json") || /^\s*[{[]/.test(code)) return "json";
  if (/^\s*(npx|pnpm|npm|git|cd|bun|yarn)\b/.test(code)) return "bash";
  return "tsx";
}

/** Replaces `<CodeSnippet ... code={`...`} />` (may span lines) with a fence. */
function convertCodeSnippets(body: string): string {
  return body.replace(
    /<CodeSnippet\b([^>]*?)code=\{`((?:\\`|[^`])*)`\}([^>]*?)\/>/g,
    (_m, before: string, code: string, after: string) => {
      const unescaped = code.replace(/\\`/g, "`").replace(/\\\$\{/g, "${");
      const label = attr(`${before} ${after}`, "label");
      return fence(unescaped, snippetLang(label, unescaped));
    },
  );
}

function convertJsxLine(line: string): string | null {
  const trimmed = line.trim();
  const tagName = trimmed.match(/^<\/?([A-Z][\w.]*)/)?.[1];
  if (!tagName) return line;

  switch (tagName) {
    case "InstallCommand": {
      const name = attr(trimmed, "name");
      return name ? fence(`${CLI} add ${name}`, "bash") : null;
    }
    case "CommandRail": {
      const command = attr(trimmed, "command");
      return command ? fence(command, "bash") : null;
    }
    case "SearchCommand": {
      const query = attr(trimmed, "query");
      return query ? fence(`${CLI} search -q ${query}`, "bash") : null;
    }
    case "Card": {
      const title = attr(trimmed, "title");
      const href = attr(trimmed, "href");
      if (!title) return null;
      const description = attr(trimmed, "description");
      const link = href ? `[${title}](${toMarkdownUrl(href)})` : title;
      return `- ${link}${description ? `: ${description}` : ""}`;
    }
    default:
      // A tag that also carries prose on the same line (`<Callout>text</Callout>`)
      // keeps the prose; wrapper-only and self-closing lines are dropped.
      return trimmed.replace(/<\/?[A-Z][^>]*>/g, "").trim() || null;
  }
}

/**
 * Strips `import`/`export` lines and JSX-only lines from MDX, converting the
 * docs components that carry real content (install commands, code snippets,
 * cards) to Markdown. Lines inside code fences are never touched.
 */
export function mdxToMarkdown(mdx: string, siteUrl?: string): string {
  const lines = convertCodeSnippets(stripFrontmatter(mdx)).split("\n");
  const out: string[] = [];
  let fenceMarker: string | null = null;

  for (const line of lines) {
    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);
    if (fenceMatch) {
      if (!fenceMarker) fenceMarker = fenceMatch[1];
      else if (line.trim().startsWith(fenceMarker)) fenceMarker = null;
      out.push(line);
      continue;
    }
    if (fenceMarker) {
      out.push(line);
      continue;
    }
    if (/^(import|export)\s/.test(line)) continue;
    const converted = convertJsxLine(line);
    if (converted === null) out.push("");
    else if (siteUrl) out.push(absolutizeDocsLinks(converted, siteUrl));
    else out.push(converted);
  }

  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function tableCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

export function propsTable(props: ComponentReference["props"]): string {
  const rows = props.map(
    (prop) =>
      `| \`${prop.name}\`${prop.required ? " (required)" : ""} | \`${tableCell(prop.type)}\` | ${
        prop.default ? `\`${tableCell(prop.default)}\`` : "-"
      } | ${tableCell(prop.description)} |`,
  );
  return ["| Name | Type | Default | Description |", "| --- | --- | --- | --- |", ...rows].join(
    "\n",
  );
}

export type ComponentMarkdownInput = {
  slug: string;
  title: string;
  description?: string;
  url: string;
  mdx: string;
  reference?: ComponentReference;
  /** Resolves a related slug to its page title; falls back to the slug. */
  relatedTitle?: (slug: string) => string | undefined;
  siteUrl: string;
};

/** Component page markdown built from data, with the MDX supplying only the prose. */
export function buildComponentMarkdown(input: ComponentMarkdownInput): string {
  const { slug, reference, siteUrl } = input;
  const prose = mdxToMarkdown(input.mdx, siteUrl);
  const sections: (string | null)[] = [
    `# ${input.title}`,
    input.description ? `> ${input.description}` : null,
    `Source: ${siteUrl}${input.url}`,
    `## Installation\n\n${fence(`${CLI} add ${slug}`, "bash")}`,
    prose || null,
  ];

  if (reference) {
    sections.push(`## Usage\n\n${fence(reference.usage, "tsx")}`);
    if (reference.note) sections.push(reference.note);
    if (reference.props.length > 0) sections.push(`## Props\n\n${propsTable(reference.props)}`);
    if (reference.related?.length) {
      const links = reference.related.map(
        (related) =>
          `- [${input.relatedTitle?.(related) ?? related}](${siteUrl}/docs/components/${related}.md)`,
      );
      sections.push(`## Related\n\n${links.join("\n")}`);
    }
  }

  sections.push(
    `## Machine-readable references\n\n- Props and usage as JSON: ${siteUrl}/ai/components/${slug}.json\n- Component index: ${siteUrl}/ai/components.json`,
  );

  return `${sections.filter(Boolean).join("\n\n")}\n`;
}

export function buildPageMarkdown(input: {
  title: string;
  description?: string;
  url: string;
  mdx: string;
  siteUrl: string;
}): string {
  const sections = [
    `# ${input.title}`,
    input.description ? `> ${input.description}` : null,
    `Source: ${input.siteUrl}${input.url}`,
    mdxToMarkdown(input.mdx, input.siteUrl),
  ];
  return `${sections.filter(Boolean).join("\n\n")}\n`;
}
