#!/usr/bin/env node
/**
 * Mirror Remotion docs from the official GitHub MDX source (same as remotion.dev).
 * Usage: node scripts/fetch-remotion-docs.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "skills/remotion/docs");
const GITHUB_BASE =
  "https://raw.githubusercontent.com/remotion-dev/remotion/main/packages/docs/docs";

/** path on remotion.dev/docs/{path} → mdx file in packages/docs/docs */
const PAGES = [
  { slug: "sequence", mdx: "sequence.mdx" },
  { slug: "absolute-fill", mdx: "absolute-fill.mdx" },
  { slug: "animating-properties", mdx: "animating-properties.mdx" },
  { slug: "interpolate", mdx: "interpolate.mdx" },
  { slug: "use-current-frame", mdx: "use-current-frame.mdx" },
  { slug: "spring", mdx: "spring.mdx" },
  { slug: "easing", mdx: "easing.mdx" },
  { slug: "series", mdx: "series.mdx" },
  { slug: "player", mdx: "player/index.mdx" },
  { slug: "transitions/transitionseries", mdx: "transitions/transitionseries.mdx" },
  { slug: "transitions", mdx: "transitions/index.mdx" },
];

function stripMdxFrontmatter(text) {
  return text.replace(/^---[\s\S]*?---\n/, "");
}

function mdxToMarkdown(text) {
  return stripMdxFrontmatter(text)
    .replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?\n/g, "")
    .replace(/<(?:Note|Info|Warning|Tip)[^>]*>([\s\S]*?)<\/(?:Note|Info|Warning|Tip)>/gi, "\n> $1\n")
    .replace(/<Tab[^>]*>([\s\S]*?)<\/Tab>/gi, "$1\n")
    .replace(/<Tabs[^>]*>([\s\S]*?)<\/Tabs>/gi, "$1\n")
    .replace(/<[^>]+>/g, "")
    .trim();
}

fs.mkdirSync(OUT, { recursive: true });

const index = [];
const today = new Date().toISOString().slice(0, 10);

for (const { slug, mdx } of PAGES) {
  const url = `${GITHUB_BASE}/${mdx}`;
  const outfile = path.join(OUT, `${slug.replace(/\//g, "-")}.md`);
  const docUrl = `https://www.remotion.dev/docs/${slug}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(45_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw = await res.text();
    const body = mdxToMarkdown(raw);
    const content = [
      `# ${slug}`,
      "",
      `> Official: [${docUrl}](${docUrl})`,
      `> Source MDX: [${url}](${url})`,
      `> Mirrored: ${today}`,
      "",
      body,
    ].join("\n");
    fs.writeFileSync(outfile, content);
    index.push({ slug, file: path.basename(outfile), docUrl, bytes: content.length });
    console.log(`✓ ${slug} (${content.length} bytes)`);
  } catch (err) {
    console.error(`✗ ${slug}: ${err.message}`);
    index.push({ slug, docUrl, error: err.message });
  }
}

fs.writeFileSync(
  path.join(OUT, "INDEX.md"),
  [
    "# Remotion official docs mirror",
    "",
    `Last updated: **${today}**`,
    "",
    "Fetched from [remotion-dev/remotion](https://github.com/remotion-dev/remotion) `packages/docs/docs/*.mdx` — the same source that powers [remotion.dev/docs](https://www.remotion.dev/docs).",
    "",
    "Refresh: `pnpm docs:remotion`",
    "",
    "| Topic | Local file | Live docs |",
    "|-------|------------|-----------|",
    ...index.map((e) =>
      e.error
        ? `| ${e.slug} | — | [link](${e.docUrl}) — ${e.error} |`
        : `| ${e.slug} | [${e.file}](./${e.file}) | [${e.docUrl}](${e.docUrl}) |`,
    ),
    "",
    "## Rules for RemotionUI components",
    "",
    "From official docs + `skills/remotion/rules/`:",
    "",
    "1. **Animate with frames** — `useCurrentFrame()` + `interpolate()` / `spring()`. CSS transitions/animations do not render.",
    "2. **`AbsoluteFill`** — full-frame layering only (scenes, backgrounds). Not for wrapping list items.",
    "3. **`Sequence layout=\"none\"`** — stagger inline children without absolute stacking (see `sequence.md`).",
    "4. **`premountFor`** — premount sequences before they play (see `sequence.md`, `series.md`).",
    "5. **`TransitionSeries`** — scene transitions; durations overlap (see `transitions-transitionseries.md`).",
    "6. **Enter = ease-out, exit = ease-in** — see `easing.md` and `skills/remotion/rules/timing.md`.",
  ].join("\n"),
);

console.log(`\nWrote ${path.join(OUT, "INDEX.md")}`);
