#!/usr/bin/env tsx
/**
 * Build the README hero: `.github/assets/readme-hero.webp`.
 *
 * Usage:
 *   pnpm --filter web gen:readme-hero
 *   pnpm --filter web gen:readme-hero --keep     # keep the PNG frames
 *
 * Why animated WebP and not video or GIF. GitHub's README renderer discards
 * author attributes on `<video>` and emits only `controls muted`, so a video is
 * always click-to-play — above-the-fold motion has to be GIF or animated WebP.
 * WebP loops, autoplays, and avoids the 256-colour dither that bands every
 * gradient in a GIF.
 *
 * Why this does NOT go MP4 -> ffmpeg -> PNG like `gen-readme-tiles.mts`. That
 * script has to, because `render:component` only emits MP4. Here we own the
 * entry point, so we render a PNG sequence straight out of Remotion and hand it
 * to the encoder. H.264 is skipped entirely, which matters a lot for this
 * asset: the whole point of the composition is that it is flat fills and crisp
 * type, and putting a lossy block-transform intermediate in front of the final
 * encode would reintroduce exactly the artefacts it was designed to avoid.
 * (`remotion.config.js` also sets the image format to JPEG globally, so the
 * per-frame format is overridden explicitly below rather than inherited.)
 *
 * Quality ladder: lossless first. This content is flat enough that a fully
 * lossless animation lands well inside budget, and lossless is the only way to
 * promise the dark background has no banding at all. The lossy steps exist as a
 * fallback so a future edit that adds texture still produces a shippable file
 * instead of a 9MB one.
 *
 * GitHub's README image ceiling is 10MB. The previous hero was squeezed to
 * 402KB for no reason and that over-compression was part of what made it look
 * broken, so the budget here is deliberately generous.
 *
 * Needs `img2webp` on PATH (Homebrew: `brew install webp`). Note that ffmpeg on
 * macOS/Homebrew cannot DECODE animated WebP, so verify the output with
 * `sharp(file, { page: n })` — not `ffmpeg -i`, and not `webpmux -get frame N`,
 * which returns uncomposited dispose frames that look catastrophically wrong.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  README_HERO_DURATION,
  README_HERO_FPS,
} from "../showcase/readme-hero/src/readme-hero";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(appRoot, "..", "..");

const entryPath = path.join(appRoot, "showcase", "readme-hero", "src", "index.ts");
const outPath = path.join(repoRoot, ".github", "assets", "readme-hero.webp");
/**
 * Not under `node_modules/.cache` like the other generators: Remotion parses
 * everything after the first dot in an image-sequence output path as a file
 * extension and refuses the render ("the output directory of the image sequence
 * cannot have an extension"). The path therefore has to be dot-free end to end.
 */
const frameDir = path.join(appRoot, "node_modules", "readme-hero-frames");

const COMPOSITION_ID = "ReadmeHero";

/** Generous on purpose — see the header. GitHub's hard cap is 10MB. */
const MAX_BYTES = 3_000_000;

type QualityStep = { label: string; args: string[] };

const QUALITY_LADDER: QualityStep[] = [
  { label: "lossless", args: ["-lossless"] },
  { label: "q95", args: ["-lossy", "-q", "95"] },
  { label: "q90", args: ["-lossy", "-q", "90"] },
  { label: "q85", args: ["-lossy", "-q", "85"] },
  { label: "q80", args: ["-lossy", "-q", "80"] },
];

function parseArgs(argv: string[]) {
  let keep = false;
  for (const arg of argv) {
    if (arg === "--keep") keep = true;
    else if (arg !== "--") throw new Error(`Unknown argument: ${arg}`);
  }
  return { keep };
}

function renderFrames() {
  fs.rmSync(frameDir, { recursive: true, force: true });
  fs.mkdirSync(frameDir, { recursive: true });

  execFileSync(
    "pnpm",
    [
      "exec",
      "remotion",
      "render",
      "--config=remotion.config.js",
      entryPath,
      COMPOSITION_ID,
      frameDir,
      "--sequence",
      "--image-format=png",
    ],
    { cwd: appRoot, stdio: "inherit" },
  );
}

function listFrames() {
  const frames = fs
    .readdirSync(frameDir)
    .filter((file) => file.endsWith(".png"))
    .sort()
    .map((file) => path.join(frameDir, file));

  if (frames.length !== README_HERO_DURATION) {
    throw new Error(
      `Expected ${README_HERO_DURATION} frames, got ${frames.length}. ` +
        "The composition length and the generator disagree, which is how a loop acquires a seam.",
    );
  }
  return frames;
}

function encode(frames: string[]) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  // Whole milliseconds. 25fps is exactly 40ms, which is why the composition is
  // authored at 25 rather than the repo's usual 30 (33.33ms does not divide).
  const delay = Math.round(1000 / README_HERO_FPS);
  if (delay * README_HERO_FPS !== 1000) {
    throw new Error(`fps ${README_HERO_FPS} does not map to a whole-millisecond frame delay.`);
  }

  for (const step of QUALITY_LADDER) {
    execFileSync(
      "img2webp",
      ["-loop", "0", "-d", String(delay), ...step.args, "-m", "6", ...frames, "-o", outPath],
      { stdio: "ignore" },
    );
    const bytes = fs.statSync(outPath).size;
    if (bytes <= MAX_BYTES) return { bytes, label: step.label };
    console.log(`  ${step.label}: ${(bytes / 1024 / 1024).toFixed(2)}MB — over budget, stepping down`);
  }

  return { bytes: fs.statSync(outPath).size, label: QUALITY_LADDER.at(-1)!.label };
}

function main() {
  const { keep } = parseArgs(process.argv.slice(2));

  renderFrames();
  const frames = listFrames();
  const { bytes, label } = encode(frames);

  const seconds = README_HERO_DURATION / README_HERO_FPS;
  console.log("");
  console.log(`${path.relative(repoRoot, outPath)}`);
  console.log(
    `  ${frames.length} frames  ${seconds.toFixed(2)}s @ ${README_HERO_FPS}fps  ` +
      `${(bytes / 1024).toFixed(0)}KB  ${label}`,
  );
  if (bytes > MAX_BYTES) {
    console.log("  OVER BUDGET at the lowest quality step");
    process.exitCode = 1;
  }

  if (!keep) fs.rmSync(frameDir, { recursive: true, force: true });
}

main();
