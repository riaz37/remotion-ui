#!/usr/bin/env node
/**
 * Post-process the synced upstream Remotion skills:
 *
 * 1. Fix the router's sibling-skill links. Upstream writes `./remotion-x/SKILL.md`
 *    from inside `remotion-best-practices/SKILL.md`; as installed they are siblings,
 *    so the correct path is `../remotion-x/SKILL.md`.
 * 2. Re-apply the RemotionUI docs-mirror section to the router skill.
 *
 * Run after scripts/sync-remotion-skills.sh.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKILLS_DIR = path.join(ROOT, "skills/remotion");
const ROUTER = path.join(SKILLS_DIR, "remotion-best-practices/SKILL.md");

const DOCS_SECTION = `## Official docs mirror (read first)

Before building or changing RemotionUI components, read the mirrored official docs in **[../docs/INDEX.md](../docs/INDEX.md)**.
They are fetched from \`remotion-dev/remotion\` MDX (same source as [remotion.dev/docs](https://www.remotion.dev/docs)).

Refresh the mirror: \`pnpm docs:remotion\`

Key pages for RemotionUI:

- [../docs/sequence.md](../docs/sequence.md) — \`layout="none"\`, timing children
- [../docs/absolute-fill.md](../docs/absolute-fill.md) — full-frame layering only
- [../docs/animating-properties.md](../docs/animating-properties.md) — \`useCurrentFrame()\` + \`interpolate()\`
- [../docs/transitions-transitionseries.md](../docs/transitions-transitionseries.md) — scene transitions

`;

if (!fs.existsSync(ROUTER)) {
  console.error(
    `Router skill not found at ${path.relative(ROOT, ROUTER)}. Run scripts/sync-remotion-skills.sh first.`,
  );
  process.exit(1);
}

let content = fs.readFileSync(ROUTER, "utf-8");

const linkFixed = content.replace(
  /\]\(\.\/(remotion-[a-z-]+\/SKILL\.md)\)/g,
  "](../$1)",
);
if (linkFixed !== content) {
  content = linkFixed;
  console.log("Rewrote sibling-skill links in remotion-best-practices/SKILL.md");
}

if (content.includes("## Official docs mirror")) {
  console.log("remotion-best-practices/SKILL.md already has docs mirror section");
} else {
  // Insert directly after the frontmatter block.
  const fmMatch = content.match(/^---\n[\s\S]*?\n---\n/);
  if (!fmMatch) {
    console.error("Could not find frontmatter in remotion-best-practices/SKILL.md");
    process.exit(1);
  }
  const insertAt = fmMatch[0].length;
  content = `${content.slice(0, insertAt)}\n${DOCS_SECTION}${content.slice(insertAt)}`;
  console.log("Patched remotion-best-practices/SKILL.md with docs mirror section");
}

fs.writeFileSync(ROUTER, content);
