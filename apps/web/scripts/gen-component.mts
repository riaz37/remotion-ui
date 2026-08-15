/**
 * Scaffold a registry component across all nine registration points.
 *
 *   pnpm gen:component <slug> [--kind primitive|block] [--dry-run] [--force]
 *   pnpm gen:component --lane cuts            # every unbuilt slug in a lane
 *   pnpm gen:component --list                 # what the spec still owes
 *
 * The slug's lane, tags, tier and one-line intent come from the expansion spec
 * (docs-internal/expansion-200-spec.md) so the spec stays the single source of
 * truth and this script never invents metadata.
 *
 * Every write is idempotent: a registration point that already mentions the slug
 * is left alone and reported as `skip`. Re-running after a hand-edit is safe.
 *
 * What this does NOT do: write the animation. The component and preview bodies
 * are deliberately obvious placeholders — the point is to collapse the wiring,
 * not to guess the motion. A scaffolded component renders a visible TODO card so
 * it can never be mistaken for finished work in an audit sheet.
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const WEB = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPO = join(WEB, "..", "..");
const SPEC = join(REPO, "docs-internal", "expansion-200-spec.md");

type Lane = "atoms" | "signals" | "vectors" | "spatial" | "blocks" | "cuts" | "reels";
type Kind = "primitive" | "block";

type SpecEntry = {
  slug: string;
  lane: Lane;
  tags: string[];
  tier: "core" | "advanced";
  intent: string;
};

/** Lanes whose components are full-frame scenes rather than inline primitives. */
const BLOCK_LANES: ReadonlySet<Lane> = new Set(["blocks", "reels"]);

/** `drive` is not in the spec tables — it follows from the lane. */
const LANE_DRIVE: Record<Lane, string> = {
  atoms: "time",
  cuts: "time",
  vectors: "time",
  blocks: "time",
  reels: "time",
  signals: "data",
  spatial: "spatial",
};

// ---------------------------------------------------------------- spec parsing

/**
 * Reads the spec's lane sections. Stops at "## Rejected" — everything below it
 * is a table of things that must never be built, and parsing it would hand the
 * generator a list of duplicates.
 */
function parseSpec(): SpecEntry[] {
  const text = readFileSync(SPEC, "utf8");
  const stop = text.indexOf("## Rejected");
  const body = stop === -1 ? text : text.slice(0, stop);
  const lines = body.split("\n");

  const entries: SpecEntry[] = [];
  let lane: Lane | null = null;
  let cols: string[] = [];

  for (const line of lines) {
    const heading = /^##\s+(\w+)\s+—\s+\+\d+/.exec(line);
    if (heading) {
      const name = heading[1] as Lane;
      lane = name in LANE_DRIVE ? name : null;
      continue;
    }
    if (!lane || !line.startsWith("|")) continue;

    const cells = line.split("|").slice(1, -1).map((c) => c.trim());

    // Header row: remember the column layout, which differs between tables
    // (some lanes have no Tags column).
    if (/^slug$/i.test(cells[0] ?? "")) {
      cols = cells.map((c) => c.toLowerCase());
      continue;
    }
    if (cells[0]?.startsWith("---") || !cells[0]?.startsWith("`")) continue;

    const slug = cells[0].replace(/`/g, "").trim();
    const at = (name: string) => {
      const i = cols.indexOf(name);
      return i === -1 ? "" : (cells[i] ?? "");
    };
    const rawTags = at("tags");
    const tier = at("tier") === "advanced" ? "advanced" : "core";

    entries.push({
      slug,
      lane,
      tier,
      tags: rawTags && rawTags !== "—" ? rawTags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      intent: stripMarkup(at("intent")),
    });
  }
  return entries;
}

/** The spec's Intent column is prose with emphasis and backticks; docs want plain text. */
function stripMarkup(s: string): string {
  return s.replace(/\*\*/g, "").replace(/`/g, "").replace(/\s+/g, " ").trim();
}

/** First sentence only — registry descriptions are one line. */
function firstSentence(s: string): string {
  const m = /^(.+?[.!?])(\s|$)/.exec(s);
  return (m ? m[1] : s).replace(/\.$/, "");
}

const pascal = (slug: string) =>
  slug.split("-").map((p) => p[0].toUpperCase() + p.slice(1)).join("");
const title = (slug: string) =>
  slug.split("-").map((p) => p[0].toUpperCase() + p.slice(1)).join(" ");

// ------------------------------------------------------------ edit primitives

type Edit = { file: string; status: "write" | "skip"; note?: string };
const edits: Edit[] = [];
let DRY = false;

function rel(p: string) {
  return p.replace(REPO + "/", "");
}

function put(path: string, contents: string, force: boolean) {
  if (existsSync(path) && !force) {
    edits.push({ file: rel(path), status: "skip", note: "exists" });
    return;
  }
  if (!DRY) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, contents);
  }
  edits.push({ file: rel(path), status: "write" });
}

/**
 * Inserts a block into a TS object literal, before the line that closes it.
 * `anchor` is the object's opening line; depth counting from there finds the
 * close, so a nested object inside the literal cannot end the search early.
 */
function insertIntoObject(path: string, anchor: RegExp, block: string, marker: string) {
  const text = readFileSync(path, "utf8");
  if (text.includes(marker)) {
    edits.push({ file: rel(path), status: "skip", note: "already registered" });
    return;
  }
  const lines = text.split("\n");
  const start = lines.findIndex((l) => anchor.test(l));
  if (start === -1) throw new Error(`anchor ${anchor} not found in ${rel(path)}`);

  let depth = 0;
  for (let i = start; i < lines.length; i++) {
    for (const ch of lines[i]) {
      if (ch === "{") depth++;
      else if (ch === "}") depth--;
    }
    if (depth === 0 && i > start) {
      lines.splice(i, 0, block);
      if (!DRY) writeFileSync(path, lines.join("\n"));
      edits.push({ file: rel(path), status: "write" });
      return;
    }
  }
  throw new Error(`unbalanced object at ${anchor} in ${rel(path)}`);
}

/** Appends after the last line matching `after`, keeping related lines grouped. */
function insertAfterLast(path: string, after: RegExp, line: string, marker: string) {
  const text = readFileSync(path, "utf8");
  if (text.includes(marker)) {
    edits.push({ file: rel(path), status: "skip", note: "already registered" });
    return;
  }
  const lines = text.split("\n");
  let at = -1;
  for (let i = 0; i < lines.length; i++) if (after.test(lines[i])) at = i;
  if (at === -1) throw new Error(`no line matching ${after} in ${rel(path)}`);
  lines.splice(at + 1, 0, line);
  if (!DRY) writeFileSync(path, lines.join("\n"));
  edits.push({ file: rel(path), status: "write" });
}

// ------------------------------------------------------------------ templates

function componentSource(e: SpecEntry, kind: Kind): string {
  const Name = pascal(e.slug);
  const frame =
    kind === "block"
      ? `    <AbsoluteFill style={{ display: "grid", placeItems: "center", background: "#0b0b0f" }}>`
      : `    <div style={{ display: "inline-block" }}>`;
  const close = kind === "block" ? `    </AbsoluteFill>` : `    </div>`;
  const imports = kind === "block" ? `import { AbsoluteFill, useCurrentFrame } from "remotion";` : `import { useCurrentFrame } from "remotion";`;

  return `${imports}

export type ${Name}Props = {
  /** Frames to wait before this starts. */
  delayInFrames?: number;
  /** Length of the entrance. */
  durationInFrames?: number;
  /** Frame the exit begins on. */
  exitAtInFrames?: number;
  /** Length of the exit. */
  exitInFrames?: number;
};

/**
 * ${e.intent}
 *
 * TODO(scaffold): unimplemented. Replace the placeholder body below.
 * Lane: ${e.lane}${e.tags.length ? ` · tags: ${e.tags.join(", ")}` : ""} · tier: ${e.tier}
 */
export const ${Name}: React.FC<${Name}Props> = ({
  delayInFrames = 0,
  durationInFrames = 30,
  exitAtInFrames = 90,
  exitInFrames = 20,
}) => {
  const frame = useCurrentFrame();
  const clamp = (v: number) => Math.min(1, Math.max(0, v));

  // The placeholder carries an exit on purpose. audit:stills samples 15/50/90%
  // and reports a still tail as a defect; an entrance that settles and holds
  // would make every unbuilt scaffold a false positive on the audit sheet.
  const enter = clamp((frame - delayInFrames) / durationInFrames);
  const exit = clamp((frame - exitAtInFrames) / exitInFrames);
  const progress = enter * (1 - exit);

  return (
${frame}
      <span
        style={{
          fontFamily: "ui-monospace, monospace",
          fontSize: 24,
          color: "#f5f5f7",
          opacity: progress,
        }}
      >
        TODO: ${e.slug}
      </span>
${close}
  );
};
`;
}

function previewSource(e: SpecEntry, kind: Kind): string {
  const Name = pascal(e.slug);
  const body =
    kind === "block"
      ? `    <${Name} />`
      : `    <div style={{ display: "grid", placeItems: "center", width: "100%" }}>
      <${Name} delayInFrames={2} durationInFrames={40} />
    </div>`;

  return `"use client";

import { ${Name} } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

/**
 * The audit samples at 15% / 50% / 90% of the window — frames 18, 60 and 108 on
 * the 120-frame default. Motion must still be running at frame 18 and not yet
 * settled at 60, or all three samples land on a still image and the preview is
 * reported dead. See docs-internal/preview-audit-rubric.md.
 */
export const ${Name}Preview: React.FC = () => (
  <PreviewFrame lane="${e.lane}"${kind === "primitive" ? " padding={72}" : ""}>
${body}
  </PreviewFrame>
);
`;
}

function mdxSource(e: SpecEntry): string {
  const Name = pascal(e.slug);
  return `---
title: ${title(e.slug)}
description: ${firstSentence(e.intent)}. Install with npx remotion-ui@latest add ${e.slug}.
---

import { ${Name}Preview } from '@/components/previews/${e.slug}';

<ComponentPage name="${e.slug}" preview={${Name}Preview} durationInFrames={120}>

${e.intent}

## Usage

\`\`\`tsx
import { ${Name} } from "@/remotion/${e.lane === "blocks" || e.lane === "reels" ? "scenes" : "primitives"}/${e.slug}";

<${Name} />
\`\`\`

</ComponentPage>
`;
}

// ------------------------------------------------------------------ generator

function generate(e: SpecEntry, kindOverride: Kind | undefined, force: boolean) {
  const kind: Kind = kindOverride ?? (BLOCK_LANES.has(e.lane) ? "block" : "primitive");
  const Name = pascal(e.slug);
  const dir = kind === "block" ? "scenes" : "primitives";
  const filePath =
    kind === "block"
      ? `registry/bases/default/scenes/${e.slug}/index.tsx`
      : `registry/bases/default/primitives/${e.slug}.tsx`;

  // 1. component
  put(join(WEB, filePath), componentSource(e, kind), force);

  // 2. registry.json
  const registryPath = join(WEB, "registry.json");
  const registry = JSON.parse(readFileSync(registryPath, "utf8"));
  if (registry.items.some((i: { name: string }) => i.name === e.slug)) {
    edits.push({ file: "apps/web/registry.json", status: "skip", note: "already registered" });
  } else {
    registry.items.push({
      name: e.slug,
      type: kind === "block" ? "registry:block" : "registry:ui",
      description: firstSentence(e.intent),
      dependencies: ["remotion"],
      registryDependencies: ["layout"],
      files: [{ path: filePath, type: kind === "block" ? "registry:block" : "registry:ui" }],
    });
    if (!DRY) writeFileSync(registryPath, JSON.stringify(registry, null, 2) + "\n");
    edits.push({ file: "apps/web/registry.json", status: "write" });
  }

  // 3. atlas — load-bearing. getAtlasSections() is the only browse index, so a
  //    missing entry means a fully built component is invisible with no error.
  const tags = e.tags.length ? `, tags: [${e.tags.map((t) => `"${t}"`).join(", ")}]` : "";
  insertIntoObject(
    join(WEB, "registry/atlas.ts"),
    /^export const REGISTRY_ATLAS/,
    `  "${e.slug}": { lane: "${e.lane}", drive: "${LANE_DRIVE[e.lane]}", tier: "${e.tier}"${tags} },`,
    `"${e.slug}":`,
  );

  // 4. preview duration
  insertIntoObject(
    join(WEB, "lib/preview-config.ts"),
    /^export const PREVIEW_META/,
    `  "${e.slug}": { durationInFrames: 120 },`,
    `"${e.slug}":`,
  );

  // 5. preview wrapper
  put(join(WEB, `components/previews/${e.slug}.tsx`), previewSource(e, kind), force);

  // 6. mini-preview map (import + entry)
  const mini = join(WEB, "components/atlas-mini-preview.tsx");
  insertAfterLast(mini, /^import .* from "\.\/previews\//, `import { ${Name}Preview } from "./previews/${e.slug}";`, `previews/${e.slug}"`);
  insertAfterLast(mini, /^\s{2}"[a-z0-9-]+": \w+Preview,/, `  "${e.slug}": ${Name}Preview,`, `"${e.slug}": ${Name}Preview`);

  // 7. export
  insertAfterLast(
    join(WEB, "components/registry-exports.ts"),
    /^export \{/,
    `export { ${Name} } from "../registry/bases/default/${dir}/${e.slug}${kind === "block" ? "" : ""}";`,
    `/${e.slug}"`,
  );

  // 8. agent-facing reference
  insertIntoObject(
    join(WEB, "lib/component-reference.ts"),
    /^export const componentReference/,
    `  "${e.slug}": {
    category: "${kind === "block" ? "scene" : "primitive"}",
    usage: \`import { ${Name} } from "@/remotion/${dir}/${e.slug}";

<${Name} />\`,
    // No \`schema\` fields: component-reference.test.ts reserves JSON-Schema prop
    // fragments for FLAGSHIP_COMPONENTS, and a scaffold has not earned that.
    // Add them by hand when the component is finished and promoted.
    props: [
      { name: "delayInFrames", type: "number", default: "0", description: "Frames to wait before this starts." },
      { name: "durationInFrames", type: "number", default: "30", description: "Length of the entrance." },
    ],
  },`,
    `"${e.slug}": {`,
  );

  // 9. docs
  put(join(WEB, `content/docs/components/${e.slug}.mdx`), mdxSource(e), force);
}

// ----------------------------------------------------------------------- main

const argv = process.argv.slice(2);
DRY = argv.includes("--dry-run");
const force = argv.includes("--force");
const kindArg = argv.includes("--kind")
  ? (argv[argv.indexOf("--kind") + 1] as Kind)
  : undefined;
const laneArg = argv.includes("--lane") ? (argv[argv.indexOf("--lane") + 1] as Lane) : undefined;
const slugs = argv.filter((a) => !a.startsWith("--") && a !== kindArg && a !== laneArg);

const spec = parseSpec();
const built = new Set(
  (JSON.parse(readFileSync(join(WEB, "registry.json"), "utf8")).items as { name: string }[]).map(
    (i) => i.name,
  ),
);

if (argv.includes("--list")) {
  const todo = spec.filter((e) => !built.has(e.slug));
  const byLane = new Map<Lane, SpecEntry[]>();
  for (const e of todo) byLane.set(e.lane, [...(byLane.get(e.lane) ?? []), e]);
  console.log(`spec: ${spec.length} entries · built: ${spec.length - todo.length} · remaining: ${todo.length}\n`);
  for (const [lane, items] of byLane) {
    console.log(`${lane} (${items.length})`);
    console.log(`  ${items.map((i) => i.slug).join(", ")}\n`);
  }
  process.exit(0);
}

let targets: SpecEntry[];
if (laneArg) {
  targets = spec.filter((e) => e.lane === laneArg && !built.has(e.slug));
} else if (slugs.length) {
  targets = slugs.map((s) => {
    const found = spec.find((e) => e.slug === s);
    if (!found) {
      console.error(
        `\n"${s}" is not in the spec.\n` +
          `Add it to ${rel(SPEC)} first — the spec is the source of truth, and the\n` +
          `Rejected table there exists so duplicates do not get rebuilt.\n`,
      );
      process.exit(1);
    }
    return found;
  });
} else {
  console.error("usage: gen:component <slug…> | --lane <lane> | --list  [--kind primitive|block] [--dry-run] [--force]");
  process.exit(1);
}

if (!targets.length) {
  console.log(laneArg ? `nothing left to scaffold in ${laneArg}` : "nothing to do");
  process.exit(0);
}

for (const e of targets) {
  edits.length = 0;
  generate(e, kindArg, force);
  // atlas-mini-preview takes two edits (import + map entry) but is one of the
  // nine registration points, so count distinct files rather than writes.
  const wrote = new Set(edits.filter((x) => x.status === "write").map((x) => x.file)).size;
  console.log(`\n${e.slug}  (${e.lane}/${e.tier})  ${wrote}/9 registration points${DRY ? "  [dry run]" : ""}`);
  for (const x of edits) {
    console.log(`  ${x.status === "write" ? "+" : "·"} ${x.file}${x.note ? `  (${x.note})` : ""}`);
  }
}

console.log(
  `\n${targets.length} component(s) scaffolded.${DRY ? " Nothing written." : ""}\n` +
    `Next: pnpm registry:build, then write the animation — every scaffold renders\n` +
    `a "TODO" card until you do. Gate each batch on pnpm audit:stills.\n`,
);
