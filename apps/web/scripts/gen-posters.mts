#!/usr/bin/env tsx
/**
 * Render one still poster per catalog card to `public/previews/<slug>.webp`.
 *
 * The poster is the same preview the catalog card mounts: the slug → component
 * table is read straight out of `components/atlas-mini-preview.tsx`, and each
 * preview renders at its `lib/preview-config.ts` framing — the numbers the card
 * Player uses.
 *
 * Frame rule. `preview-config` carries no poster frame, so the poster is the
 * still audit's "hold" sample: 50% of the preview's own window
 * (`floor(durationInFrames * 0.5)`). The audit rubric
 * (docs-internal/preview-audit-rubric.md) already requires the subject to be on
 * stage and cover a third of the frame at that sample, so every audited preview
 * has a representative 50% frame. A slug whose 50% frame is a poor poster gets
 * an entry in POSTER_FRAME_OVERRIDES (fraction of the window) below.
 *
 * Pipeline mirrors `audit:stills`: one webpack bundle, one browser, ANGLE GL
 * (WebGL/map previews render blank without it). Each still is rendered to PNG
 * at card size (640 wide for 16:9, 360 wide for 9:16), then encoded with
 * `cwebp`, stepping quality down until the file is under the size budget.
 * A near-uniform frame is reported as BLANK — a render can exit 0 and be empty.
 *
 * Usage:
 *   pnpm --filter web gen:posters
 *   pnpm --filter web gen:posters --only typewriter,map-flight
 *   pnpm --filter web gen:posters --force          # re-render up-to-date posters
 *   pnpm --filter web gen:posters --gl swiftshader # alternative GL backend
 *
 * Up to date = the webp is newer than its preview module, lib/preview-config.ts
 * and this script. Registry changes under a preview are not tracked; use --force.
 *
 * Needs network access to fonts.gstatic.com (Google Fonts load at render time),
 * plus `cwebp` and `ffmpeg` on PATH.
 */
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import {
  ensureBrowser,
  getCompositions,
  openBrowser,
  renderStill,
  type ChromiumOptions,
} from "@remotion/renderer";
import { previewMeta } from "../lib/preview-config.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");
const miniPreviewPath = path.join(appRoot, "components", "atlas-mini-preview.tsx");
const previewConfigPath = path.join(appRoot, "lib", "preview-config.ts");
const outDir = path.join(appRoot, "public", "previews");
// Under node_modules so `remotion` resolves from the generated entry and git ignores it.
const workDir = path.join(appRoot, "node_modules", ".cache", "gen-posters");

const POSTER_FRACTION = 0.5;
/** Per-slug poster frame, as a fraction of the preview window. */
/**
 * Transition previews overlap two centred scenes around frames 51-72 of 120.
 * Wipes read well at the default midpoint: the edge cuts through the text.
 * Dissolves have no clean midpoint (both scenes' text stack into a garble),
 * so they sit at the end of the overlap, where scene two reads through the
 * last of the effect.
 */
const DISSOLVE_POSTER = 0.58;
const POSTER_FRAME_OVERRIDES: Record<string, number> = {
  "blur-reveal": DISSOLVE_POSTER,
  "chromatic-aberration-wipe": DISSOLVE_POSTER,
  "frosted-glass-wipe": DISSOLVE_POSTER,
  "transition-fade": DISSOLVE_POSTER,
  "transition-light-leak": DISSOLVE_POSTER,
  "transition-liquid-warp": DISSOLVE_POSTER,
  "zoom-through": DISSOLVE_POSTER,
  // No exit; the line finishes writing by frame 115.
  "handwriting-text": 0.99,
  // Frame 108 is a settled word, not a mid-melt blob.
  "liquid-text-morph": 0.9,
};

const CARD_LONG_EDGE = 640;
const MAX_BYTES = 30_000;
const QUALITY_STEPS = [78, 70, 62, 54, 46, 38] as const;
/** Luma spread (0-255) below which a still is treated as blank. */
const BLANK_LUMA_SPREAD = 12;

type GlBackend = NonNullable<ChromiumOptions["gl"]>;
type CliOptions = { only?: string[]; force: boolean; gl: GlBackend };

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = { force: false, gl: "angle" };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--force") options.force = true;
    else if (arg === "--only") {
      options.only = (argv[++index] ?? "")
        .split(",")
        .map((slug) => slug.trim())
        .filter(Boolean);
    } else if (arg === "--gl") options.gl = argv[++index] as GlBackend;
    else if (arg !== "--") throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

type PreviewEntry = { slug: string; exportName: string; modulePath: string };

/**
 * Reads the card's slug → component table. Handles static named imports and
 * lazy `import("./previews/x")` forms, so a code-split map still parses.
 */
function readPreviewMap(): PreviewEntry[] {
  const source = fs.readFileSync(miniPreviewPath, "utf8");
  const moduleByName = new Map<string, string>();

  for (const [, names, spec] of source.matchAll(
    /import\s*\{([^}]+)\}\s*from\s*["'](\.\/previews\/[^"']+)["']/g,
  )) {
    for (const name of names.split(",").map((part) => part.trim()).filter(Boolean)) {
      moduleByName.set(name.split(/\s+as\s+/).pop()!, spec);
    }
  }
  for (const [, spec, name] of source.matchAll(
    /import\(\s*["'](\.\/previews\/[^"']+)["']\s*\)[\s\S]{0,120}?\.(\w+Preview)\b/g,
  )) {
    if (!moduleByName.has(name)) moduleByName.set(name, spec);
  }

  const mapBody = source.match(/const PREVIEWS[^=]*=\s*\{([\s\S]*?)\n\};/)?.[1];
  if (!mapBody) throw new Error("PREVIEWS map not found in atlas-mini-preview.tsx");

  // Each map line is either `slug: XPreview` or a lazy loader
  // `slug: () => import("./previews/x").then((m) => ({ default: m.XPreview }))`.
  const entries: PreviewEntry[] = [];
  for (const [, quoted, bare, lazySpec, lazyName, staticName] of mapBody.matchAll(
    /^\s*(?:"([a-z0-9-]+)"|([a-z0-9]+))\s*:\s*(?:\(\)\s*=>\s*import\(\s*["'](\.\/previews\/[^"']+)["']\s*\)[^\n]*?\.(\w+Preview)\b|(\w+Preview)\b)/gm,
  )) {
    const slug = quoted ?? bare;
    const exportName = lazyName ?? staticName;
    const spec = lazySpec ?? moduleByName.get(exportName);
    if (!spec) throw new Error(`No import found for ${exportName} (${slug})`);
    entries.push({
      slug,
      exportName,
      modulePath: path.join(path.dirname(miniPreviewPath), `${spec}.tsx`),
    });
  }
  return entries;
}

function isUpToDate(entry: PreviewEntry): boolean {
  const poster = path.join(outDir, `${entry.slug}.webp`);
  if (!fs.existsSync(poster)) return false;
  const inputs = [entry.modulePath, previewConfigPath, fileURLToPath(import.meta.url)];
  const newestInput = Math.max(...inputs.map((file) => fs.statSync(file).mtimeMs));
  return fs.statSync(poster).mtimeMs >= newestInput;
}

function writeEntry(entries: PreviewEntry[]): string {
  fs.mkdirSync(workDir, { recursive: true });
  const imports = entries
    .map((entry, index) => {
      const importPath = entry.modulePath.replace(/\.tsx$/, "");
      return `import { ${entry.exportName} as C${index} } from ${JSON.stringify(importPath)};`;
    })
    .join("\n");
  const compositions = entries
    .map((entry, index) => {
      const meta = previewMeta(entry.slug);
      return `      <Composition id="p${index}" component={C${index}} durationInFrames={${meta.durationInFrames}} fps={${meta.fps}} width={${meta.width}} height={${meta.height}} />`;
    })
    .join("\n");

  const entryPath = path.join(workDir, "index.tsx");
  fs.writeFileSync(
    entryPath,
    `import React from "react";
import { Composition, registerRoot } from "remotion";
${imports}

const Root: React.FC = () => (
  <>
${compositions}
  </>
);

registerRoot(Root);
`,
  );
  return entryPath;
}

/** Mirrors the alias block in remotion.config.js, which the bundler API does not apply. */
function webpackOverride(config: Record<string, any>) {
  config.resolve ??= {};
  const previous = config.resolve.alias;
  const base =
    previous && typeof previous === "object" && !Array.isArray(previous) ? { ...previous } : {};
  delete base["@"];
  config.resolve.alias = {
    ...base,
    "@/components": path.join(appRoot, "components"),
    "@/remotion/primitives": path.join(appRoot, "registry/bases/default/primitives"),
    "@/remotion/scenes": path.join(appRoot, "registry/bases/default/scenes"),
    "@/compositions": path.join(appRoot, "registry/bases/default/compositions"),
    "@/remotion/lib": path.join(appRoot, "registry/bases/default/lib"),
    "@/remotion/hooks": path.join(appRoot, "registry/bases/default/hooks"),
    "@/lib": path.join(appRoot, "lib"),
  };
  return config;
}

/**
 * YMAX - YMIN over the frame. Full range, not the 10th/90th percentiles: a
 * line of small text on a dark stage sits outside both percentiles and read
 * as blank. NaN when ffmpeg can't read the file.
 */
function lumaSpread(pngPath: string): number {
  // ffmpeg prints the metadata on stderr.
  const { stderr } = spawnSync(
    "ffmpeg",
    ["-hide_banner", "-i", pngPath, "-vf", "signalstats,metadata=print", "-f", "null", "-"],
    { encoding: "utf8" },
  );
  const low = Number(stderr.match(/signalstats\.YMIN=([0-9.]+)/)?.[1]);
  const high = Number(stderr.match(/signalstats\.YMAX=([0-9.]+)/)?.[1]);
  return Number.isFinite(low) && Number.isFinite(high) ? high - low : Number.NaN;
}

function encodeWebp(pngPath: string, webpPath: string): { bytes: number; quality: number } {
  let last = { bytes: Number.POSITIVE_INFINITY, quality: QUALITY_STEPS[0] as number };
  for (const quality of QUALITY_STEPS) {
    execFileSync("cwebp", ["-quiet", "-m", "6", "-q", String(quality), pngPath, "-o", webpPath]);
    last = { bytes: fs.statSync(webpPath).size, quality };
    if (last.bytes <= MAX_BYTES) break;
  }
  return last;
}

type Result = {
  slug: string;
  status: "ok" | "skipped" | "error";
  frame?: number;
  bytes?: number;
  quality?: number;
  blank?: boolean;
  error?: string;
};

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const all = readPreviewMap();
  const known = new Set(all.map((entry) => entry.slug));
  const unknown = (options.only ?? []).filter((slug) => !known.has(slug));
  if (unknown.length > 0) {
    throw new Error(`Not in the catalog preview map: ${unknown.join(", ")}`);
  }

  const selected = all.filter((entry) => !options.only || options.only.includes(entry.slug));
  const results: Result[] = [];
  const todo = selected.filter((entry) => {
    if (!options.force && isUpToDate(entry)) {
      results.push({ slug: entry.slug, status: "skipped" });
      return false;
    }
    return true;
  });

  console.log(`${selected.length} selected, ${todo.length} to render, ${results.length} up to date`);
  fs.mkdirSync(outDir, { recursive: true });

  if (todo.length > 0) {
    const entryPoint = writeEntry(todo);
    console.log("Bundling...");
    const serveUrl = await bundle({
      entryPoint,
      webpackOverride,
      publicDir: path.join(appRoot, "public"),
      onProgress: (percent) => {
        if (percent % 25 === 0) console.log(`  bundle ${percent}%`);
      },
    });

    await ensureBrowser();
    const chromiumOptions: ChromiumOptions = { gl: options.gl };
    const browser = await openBrowser("chrome", { chromiumOptions });
    const compositions = await getCompositions(serveUrl, {
      chromiumOptions,
      puppeteerInstance: browser,
    });
    const byId = new Map(compositions.map((composition) => [composition.id, composition]));
    const pngDir = path.join(workDir, "png");
    fs.mkdirSync(pngDir, { recursive: true });

    for (const [index, entry] of todo.entries()) {
      const label = `[${index + 1}/${todo.length}] ${entry.slug}`;
      const composition = byId.get(`p${index}`);
      if (!composition) {
        results.push({ slug: entry.slug, status: "error", error: "composition missing from bundle" });
        console.log(`${label}  ERROR composition missing`);
        continue;
      }
      const fraction = POSTER_FRAME_OVERRIDES[entry.slug] ?? POSTER_FRACTION;
      const frame = Math.min(
        composition.durationInFrames - 1,
        Math.floor(composition.durationInFrames * fraction),
      );
      const longEdge = Math.max(composition.width, composition.height);
      const pngPath = path.join(pngDir, `${entry.slug}.png`);
      const webpPath = path.join(outDir, `${entry.slug}.webp`);

      try {
        await renderStill({
          composition,
          serveUrl,
          output: pngPath,
          frame,
          scale: CARD_LONG_EDGE / longEdge,
          imageFormat: "png",
          overwrite: true,
          chromiumOptions,
          puppeteerInstance: browser,
          timeoutInMilliseconds: 90_000,
        });
        const spread = lumaSpread(pngPath);
        const blank = Number.isFinite(spread) && spread < BLANK_LUMA_SPREAD;
        const { bytes, quality } = encodeWebp(pngPath, webpPath);
        results.push({ slug: entry.slug, status: "ok", frame, bytes, quality, blank });
        console.log(
          `${label}  frame ${frame}  ${(bytes / 1024).toFixed(1)}KB q${quality}${blank ? "  BLANK" : ""}${bytes > MAX_BYTES ? "  OVER BUDGET" : ""}`,
        );
      } catch (error) {
        const message = (error as Error).message.split("\n")[0];
        results.push({ slug: entry.slug, status: "error", frame, error: message });
        console.log(`${label}  ERROR ${message}`);
      }
    }
    await browser.close({ silent: true });
  }

  const rendered = results.filter((result) => result.status === "ok");
  const errors = results.filter((result) => result.status === "error");
  const blank = rendered.filter((result) => result.blank);
  const report = { generatedAt: new Date().toISOString(), results };
  fs.writeFileSync(path.join(workDir, "report.json"), JSON.stringify(report, null, 2));

  const totalBytes = selected
    .map((entry) => path.join(outDir, `${entry.slug}.webp`))
    .filter((file) => fs.existsSync(file))
    .reduce((sum, file) => sum + fs.statSync(file).size, 0);

  console.log("");
  console.log(`rendered ${rendered.length}, skipped ${results.length - rendered.length - errors.length}, errors ${errors.length}, blank ${blank.length}`);
  console.log(`total    ${(totalBytes / 1024).toFixed(0)}KB across selected posters`);
  for (const result of errors) console.log(`  error  ${result.slug}: ${result.error}`);
  for (const result of blank) console.log(`  blank  ${result.slug}`);
  console.log(`report   ${path.join(workDir, "report.json")}`);
  if (errors.length > 0 || blank.length > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
