#!/usr/bin/env node
/**
 * Browser QA for RemotionUI docs previews (uses agent-browser CLI).
 * Usage: node scripts/qa-browser.mjs [baseUrl]
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DOCS_ROOT = path.join(ROOT, "apps/web/content/docs");
const PREVIEW_CATEGORIES = [
  "components",
  "primitives",
  "signals",
  "vectors",
  "spatial",
  "cuts",
  "scenes",
  "compositions",
];

const SKIP_PREVIEWS = new Set(["map-flight", "map-canvas", "map-route", "map-markers"]);

const args = process.argv.slice(2);
const baseArg = args.find((a) => !a.startsWith("--"));
const onlyArg = args.find((a) => a.startsWith("--only="))?.slice("--only=".length);

const BASE = baseArg ?? "https://remotionui.vercel.app";
const SESSION = "remotionui-qa";
const OUT = path.join(ROOT, ".qa-screenshots");
fs.mkdirSync(OUT, { recursive: true });

/** Any doc page with <RemotionPreview> gets tested — no manual list to maintain. */
function discoverPreviewPages() {
  const pages = [];
  for (const category of PREVIEW_CATEGORIES) {
    const dir = path.join(DOCS_ROOT, category);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith(".mdx")) continue;
      const content = fs.readFileSync(path.join(dir, file), "utf-8");
      if (
        !content.includes("<RemotionPreview") &&
        !content.includes("preview={")
      ) {
        continue;
      }
      const name = file.replace(/\.mdx$/, "");
      pages.push({ name, category, path: `/docs/${category}/${name}` });
    }
  }
  return pages.sort((a, b) => a.path.localeCompare(b.path));
}

const only = onlyArg ? new Set(onlyArg.split(",").map((s) => s.trim())) : null;
const PAGES = discoverPreviewPages().filter(
  (p) => (!only || only.has(p.name)) && !SKIP_PREVIEWS.has(p.name),
);

function ab(...args) {
  return execFileSync("agent-browser", ["--session", SESSION, ...args], {
    encoding: "utf-8",
  }).trim();
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

const results = [];

for (const item of PAGES) {
  const url = `${BASE}${item.path}`;
  try {
    ab("open", url);
    sleep(2500);

    let snap = ab("snapshot", "-i");
    const playMatch = snap.match(/button "Play video" \[ref=(e\d+)\]/);
    if (playMatch) {
      ab("click", `@${playMatch[1]}`);
      sleep(2500);
      snap = ab("snapshot", "-i");
    }

    ab("screenshot", path.join(OUT, `${item.name}.png`));

    const duration = snap.match(/\d+:\d+\s*\/\s*\d+:\d+/)?.[0] ?? null;
    const hasPlayer =
      /button "(Play video|Pause video)"/.test(snap) || duration !== null;
    const title =
      snap.match(/^#\s+(.+)$/m)?.[1]?.trim() ??
      item.name.replace(/-/g, " ");

    results.push({
      name: item.name,
      category: item.category,
      status: hasPlayer && duration ? "pass" : "warn",
      url,
      title,
      duration,
      hasPlayer,
    });
  } catch (err) {
    results.push({
      name: item.name,
      category: item.category,
      status: "fail",
      url,
      error: err.stderr?.toString() || err.message,
    });
  }
}

let errors = "none";
try {
  const raw = ab("errors") || "";
  const cleaned = raw
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.trim() !== "" && line.trim() !== "✗")
    .join("\n")
    .trim();
  errors = cleaned.length > 0 ? cleaned : "none";
} catch {
  /* ignore */
}

if (PAGES.length === 0) {
  console.error("No preview pages found. Add <RemotionPreview> to a doc page.");
  process.exit(1);
}

console.log("\n# RemotionUI Browser QA\n");
console.log(`Base: ${BASE}`);
console.log(`Pages: ${PAGES.length} (auto-discovered from docs with <RemotionPreview>)`);
console.log(`Screenshots: ${OUT}\n`);
console.log("| Component | Category | Status | Duration |");
console.log("|-----------|----------|--------|----------|");
for (const r of results) {
  if (r.status === "fail") {
    console.log(`| ${r.name} | ${r.category ?? "—"} | fail | ${r.error} |`);
  } else {
    console.log(
      `| ${r.name} | ${r.category} | ${r.status} | ${r.duration ?? "—"} |`,
    );
  }
}
console.log(`\nConsole errors: ${errors}`);

process.exit(results.some((r) => r.status === "fail") ? 1 : 0);
