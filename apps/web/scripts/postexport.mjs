/**
 * Runs after `next build` (output: "export"). Puts generated files at the
 * public URLs the old Vercel rewrites served them from, so no host-side
 * rewrite rules are needed:
 *
 *   /llms.txt, /llms-full.txt  <- /llms.mdx/llms*.txt
 *   /docs.md, /docs/<path>.md  <- /llms.mdx/docs/**.md
 *   /r/<name>.json             <- /r/presets/default/<name>.json
 */
import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "out");

function copy(from, to) {
  mkdirSync(dirname(to), { recursive: true });
  cpSync(from, to);
}

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

function requireDir(path) {
  if (!existsSync(path)) {
    throw new Error(`postexport: expected ${relative(out, path)} in the export output`);
  }
}

const llms = join(out, "llms.mdx");
requireDir(llms);
copy(join(llms, "llms.txt"), join(out, "llms.txt"));
copy(join(llms, "llms-full.txt"), join(out, "llms-full.txt"));

const mdRoot = join(llms, "docs");
let mdCount = 0;
for (const file of walk(mdRoot)) {
  const rel = relative(mdRoot, file);
  copy(file, rel === "index.md" ? join(out, "docs.md") : join(out, "docs", rel));
  mdCount += 1;
}

const presets = join(out, "r", "presets", "default");
requireDir(presets);
let registryCount = 0;
for (const name of readdirSync(presets)) {
  const target = join(out, "r", name);
  if (name.endsWith(".json") && !existsSync(target)) {
    copy(join(presets, name), target);
    registryCount += 1;
  }
}

console.log(`postexport: llms.txt files, ${mdCount} docs .md, ${registryCount} registry aliases`);
