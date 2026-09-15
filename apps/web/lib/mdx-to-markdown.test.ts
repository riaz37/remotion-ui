import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getComponentReference } from "./component-reference";
import { buildComponentMarkdown, mdxToMarkdown } from "./mdx-to-markdown";

const docsDir = path.join(__dirname, "..", "content", "docs");

function findMdx(dir: string, file: string): string {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const found = findMdx(full, file);
      if (found) return found;
    } else if (entry.name === file) {
      return full;
    }
  }
  return "";
}

const read = (file: string) => fs.readFileSync(findMdx(docsDir, file), "utf-8");

describe("component page markdown", () => {
  const markdown = buildComponentMarkdown({
    slug: "typewriter",
    title: "Typewriter",
    description: "Typewriter reveal.",
    url: "/docs/components/typewriter",
    mdx: read("typewriter.mdx"),
    reference: getComponentReference("typewriter"),
    siteUrl: "https://remotionui.com",
  });

  it("strips imports and JSX outside the usage fence", () => {
    const outsideFences = markdown.replace(/```[\s\S]*?```/g, "");
    expect(outsideFences).not.toMatch(/^import /m);
    expect(markdown).not.toContain("<ComponentPage");
    expect(outsideFences).not.toMatch(/<[A-Z]/);
  });

  it("keeps the prose", () => {
    expect(markdown).toContain("Types a string out under a live caret.");
  });

  it("has the install command, usage and a props table", () => {
    expect(markdown).toContain("npx remotion-ui@latest add typewriter");
    expect(markdown).toContain("## Usage");
    expect(markdown).toContain("| Name | Type | Default | Description |");
    expect(markdown).toMatch(/\| `text`/);
  });
});

describe("guide markdown", () => {
  it("turns CodeSnippet into a fence and keeps its import lines", () => {
    // Read by path: components/(captions)/captions.mdx shares the filename.
    const markdown = mdxToMarkdown(
      fs.readFileSync(path.join(docsDir, "guides", "captions.mdx"), "utf-8"),
    );
    expect(markdown).toContain('```tsx\nimport { CaptionScene } from "@/remotion/scenes/caption-scene";');
    expect(markdown).toContain("```bash\nnpx remotion-ui@latest add caption-scene caption-highlight\n```");
    expect(markdown).not.toContain("<CodeSnippet");
  });

  it("never strips inside code fences", () => {
    const mdx = "import { X } from 'x';\n\n## Code\n\n```tsx\nimport { A } from 'a';\n<Sequence from={0}>\n  <A />\n</Sequence>\n```\n\n<Callout>\nNote\n</Callout>\n";
    const markdown = mdxToMarkdown(mdx);
    expect(markdown).toBe(
      "## Code\n\n```tsx\nimport { A } from 'a';\n<Sequence from={0}>\n  <A />\n</Sequence>\n```\n\nNote",
    );
  });
});
