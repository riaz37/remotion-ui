#!/usr/bin/env tsx
/**
 * Render the README motion grid: one looping animated WebP per featured
 * component, written to `.github/assets/tiles/<slug>.webp`.
 *
 * Why animated WebP and not video or GIF. GitHub's README renderer discards
 * author attributes on `<video>` and emits only `controls muted`, so a video is
 * always click-to-play — above-the-fold motion has to be GIF or animated WebP.
 * WebP loops, autoplays, takes an ordinary repo path, and avoids the 256-colour
 * dither that bands every gradient in a GIF.
 *
 * Pipeline: `render:component` to MP4 at card size, ffmpeg to PNG frames at the
 * tile's own fps, then `img2webp`, stepping quality down until the file is under
 * budget (the same ladder `gen:posters` uses). A tile that is still over budget
 * at the lowest step is reported rather than silently shipped.
 *
 * Usage:
 *   pnpm --filter web gen:readme-tiles
 *   pnpm --filter web gen:readme-tiles --only aurora-bg,kanban-move
 *   pnpm --filter web gen:readme-tiles --keep   # keep intermediate MP4/PNGs
 *
 * Needs `ffmpeg` and `img2webp` on PATH. ffmpeg on macOS/Homebrew is built
 * without animated-WebP support, so it can encode the PNG frames but cannot
 * read the result back — verify output with `sharp(file, { page: n })`, not
 * `ffmpeg -i`.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(appRoot, "..", "..");
const outDir = path.join(repoRoot, ".github", "assets", "tiles");
const workDir = path.join(appRoot, "node_modules", ".cache", "readme-tiles");

/**
 * The featured six. Chosen to span lanes rather than to be the prettiest: a
 * background, a chart, a UI scene, a device mockup, a text effect and a
 * dev-flavoured scene.
 *
 * Every tile must be dark-stage. One light tile in the grid reads as a broken
 * image rather than as a different component, which is why no transition is
 * featured — the transition previews all render on a light stage.
 *
 * Avoid components whose 2s window is mostly empty: `word-pop-captions` spends
 * most of its preview mid-word and encodes to 8KB of near-nothing.
 */
const TILES = [
  "aurora-bg",
  "bar-chart-race",
  "kanban-move",
  "device-mockup-3d",
  "split-text-chars",
  "commit-graph",
] as const;

/** Card geometry. 320px is the widest a 3-up grid renders at on GitHub. */
const RENDER_WIDTH = 640;
const RENDER_HEIGHT = 360;
const RENDER_FRAMES = 60;
const TILE_WIDTH = 320;
const TILE_FPS = 15;
const MAX_BYTES = 80_000;
const QUALITY_STEPS = [75, 65, 55, 45, 38] as const;

type CliOptions = { only?: string[]; keep: boolean };

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = { keep: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--keep") options.keep = true;
    else if (arg === "--only") {
      options.only = (argv[++index] ?? "")
        .split(",")
        .map((slug) => slug.trim())
        .filter(Boolean);
    } else if (arg !== "--") throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

function renderMp4(slug: string, mp4Path: string) {
  execFileSync(
    "pnpm",
    [
      "--filter",
      "web",
      "render:component",
      slug,
      "--width",
      String(RENDER_WIDTH),
      "--height",
      String(RENDER_HEIGHT),
      "--duration",
      String(RENDER_FRAMES),
      "--out",
      mp4Path,
    ],
    { cwd: repoRoot, stdio: "ignore" },
  );
}

function extractFrames(mp4Path: string, frameDir: string) {
  fs.rmSync(frameDir, { recursive: true, force: true });
  fs.mkdirSync(frameDir, { recursive: true });
  execFileSync(
    "ffmpeg",
    [
      "-loglevel",
      "error",
      "-i",
      mp4Path,
      "-vf",
      `fps=${TILE_FPS},scale=${TILE_WIDTH}:-2:flags=lanczos`,
      path.join(frameDir, "%03d.png"),
    ],
    { stdio: "inherit" },
  );
}

function encodeWebp(frameDir: string, webpPath: string) {
  const frames = fs
    .readdirSync(frameDir)
    .filter((file) => file.endsWith(".png"))
    .sort()
    .map((file) => path.join(frameDir, file));
  if (frames.length === 0) throw new Error("no frames extracted");

  const delay = Math.round(1000 / TILE_FPS);
  let last = { bytes: Number.POSITIVE_INFINITY, quality: QUALITY_STEPS[0] as number };
  for (const quality of QUALITY_STEPS) {
    execFileSync(
      "img2webp",
      ["-loop", "0", "-d", String(delay), "-lossy", "-q", String(quality), "-m", "6", ...frames, "-o", webpPath],
      { stdio: "ignore" },
    );
    last = { bytes: fs.statSync(webpPath).size, quality };
    if (last.bytes <= MAX_BYTES) break;
  }
  return { ...last, frames: frames.length };
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const unknown = (options.only ?? []).filter(
    (slug) => !(TILES as readonly string[]).includes(slug),
  );
  if (unknown.length > 0) {
    throw new Error(`Not a README tile: ${unknown.join(", ")}`);
  }

  const selected = TILES.filter((slug) => !options.only || options.only.includes(slug));
  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(workDir, { recursive: true });

  let totalBytes = 0;
  const over: string[] = [];

  for (const [index, slug] of selected.entries()) {
    const label = `[${index + 1}/${selected.length}] ${slug}`;
    const mp4Path = path.join(workDir, `${slug}.mp4`);
    const frameDir = path.join(workDir, slug);
    const webpPath = path.join(outDir, `${slug}.webp`);

    renderMp4(slug, mp4Path);
    extractFrames(mp4Path, frameDir);
    const { bytes, quality, frames } = encodeWebp(frameDir, webpPath);

    totalBytes += bytes;
    if (bytes > MAX_BYTES) over.push(slug);
    console.log(
      `${label}  ${frames} frames  ${(bytes / 1024).toFixed(1)}KB q${quality}${bytes > MAX_BYTES ? "  OVER BUDGET" : ""}`,
    );

    if (!options.keep) {
      fs.rmSync(mp4Path, { force: true });
      fs.rmSync(frameDir, { recursive: true, force: true });
    }
  }

  console.log("");
  console.log(`${selected.length} tiles, ${(totalBytes / 1024).toFixed(0)}KB total`);
  for (const slug of over) console.log(`  over budget  ${slug}`);
  if (over.length > 0) process.exitCode = 1;
}

main();
