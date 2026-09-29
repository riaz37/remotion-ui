#!/usr/bin/env tsx
/**
 * Fidelity check for `remotion-ui import-ae`: render the same frames from
 * `@remotion/lottie` playback and from the generated TSX, then score them.
 *
 *   cd apps/web && npx tsx showcase/import-ae-bench/compare.mts [slug...]
 *
 * Per frame it reports PSNR and SSIM (ffmpeg) and the share of pixels whose
 * colour differs by more than 32/255 in any channel — PSNR alone can average
 * a misplaced shape away; the mismatch share cannot. Side-by-side sheets
 * (Lottie | generated | 4× amplified difference) land in `out/`.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";
import sharp from "sharp";

const here = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(here, "../..");
const outDir = path.join(here, "out");
const MISMATCH_THRESHOLD = 32;
/**
 * Reference first, then the import. `LottieWarm` has lottie-web render frame 1
 * on load, so the scored frame is always a re-render: its very first paint of
 * a page can differ (seen with stacked repeaters), and a still render of frame
 * 0 would otherwise capture only that first paint.
 */
const SIDES = ["LottieWarm", "Gen"];

/**
 * Frames where the warm lottie-web reference itself is wrong. They are still
 * scored against it (no swapping); results.json and the sheet flag them.
 * Evidence: README.md, "Known lottie-web bugs".
 */
const KNOWN_REFERENCE_BUGS: Record<string, { frames: number[]; bug: string }> = {
  "zig-zag-animated": {
    frames: [0],
    bug: "ZigZagModifier skips work at amplitude 0 without resetting the path, so a return to frame 0 keeps the previous frame's zig-zag",
  },
};

const aliases = {
  "@/components": path.join(appRoot, "components"),
  "@/remotion/primitives": path.join(appRoot, "registry/bases/default/primitives"),
  "@/remotion/scenes": path.join(appRoot, "registry/bases/default/scenes"),
  "@/compositions": path.join(appRoot, "registry/bases/default/compositions"),
  "@/remotion/lib": path.join(appRoot, "registry/bases/default/lib"),
  "@/remotion/hooks": path.join(appRoot, "registry/bases/default/hooks"),
  "@/lib": path.join(appRoot, "lib"),
};

type Fixture = { slug: string; durationInFrames: number; json: Record<string, unknown> };

/** Keyframe times anywhere in the main composition, relative to its in point. */
function keyTimes(json: Record<string, unknown>): number[] {
  const times = new Set<number>();
  const walk = (value: unknown) => {
    if (Array.isArray(value)) {
      if (value.length > 1 && value.every((v) => v && typeof v === "object" && typeof (v as { t?: unknown }).t === "number")) {
        for (const v of value) times.add((v as { t: number }).t);
      }
      value.forEach(walk);
    } else if (value && typeof value === "object") Object.values(value).forEach(walk);
  };
  walk(json.layers);
  const ip = Number(json.ip ?? 0);
  return [...times].map((t) => Math.round(t - ip)).sort((a, b) => a - b);
}

function framesFor(f: Fixture): { frame: number; label: string }[] {
  const last = f.durationInFrames - 1;
  const inside = keyTimes(f.json).filter((t) => t > 0 && t < last);
  const key = inside.length ? inside[Math.floor(inside.length / 2)] : Math.round(last / 3);
  const picks = [
    { frame: 0, label: "first" },
    { frame: key, label: "keyframe" },
    { frame: Math.round(last / 4), label: "q1" },
    { frame: Math.round(last / 2), label: "middle" },
    { frame: Math.round((last * 3) / 4), label: "q3" },
    { frame: last, label: "last" },
  ];
  const seen = new Set<number>();
  return picks.filter((p) => (seen.has(p.frame) ? false : (seen.add(p.frame), true)));
}

function ffmpegScores(a: string, b: string): { psnr: number; ssim: number } {
  // ffmpeg prints the filter summaries on stderr.
  const run = spawnSync("ffmpeg", ["-hide_banner", "-i", a, "-i", b, "-lavfi", "[0:v][1:v]ssim;[0:v][1:v]psnr", "-f", "null", "-"], {
    encoding: "utf8",
  });
  if (run.status !== 0) throw new Error(`ffmpeg failed on ${a}: ${run.stderr}`);
  const log = run.stderr;
  const ssim = Number(/All:([0-9.]+)/.exec(log)?.[1]);
  const psnrText = /average:([0-9.]+|inf)/.exec(log)?.[1];
  const psnr = psnrText === "inf" ? Number.POSITIVE_INFINITY : Number(psnrText);
  return { psnr, ssim };
}

async function mismatch(a: string, b: string): Promise<{ share: number; diff: Buffer; width: number; height: number }> {
  const [ra, rb] = await Promise.all([a, b].map((p) => sharp(p).removeAlpha().raw().toBuffer({ resolveWithObject: true })));
  const { width, height } = ra.info;
  const diff = Buffer.alloc(width * height * 3);
  let bad = 0;
  for (let i = 0; i < width * height; i += 1) {
    let worst = 0;
    for (let c = 0; c < 3; c += 1) {
      const d = Math.abs(ra.data[i * 3 + c] - rb.data[i * 3 + c]);
      worst = Math.max(worst, d);
      diff[i * 3 + c] = 255 - Math.min(255, d * 4);
    }
    if (worst > MISMATCH_THRESHOLD) bad += 1;
  }
  return { share: bad / (width * height), diff, width, height };
}

const label = (text: string, width: number) =>
  Buffer.from(
    `<svg width="${width}" height="28"><rect width="100%" height="100%" fill="#111"/><text x="8" y="19" font-family="Helvetica, Arial" font-size="14" fill="#fff">${text}</text></svg>`,
  );

async function main() {
  const only = process.argv.slice(2);
  fs.mkdirSync(outDir, { recursive: true });
  console.log("bundling…");
  const serveUrl = await bundle({
    entryPoint: path.join(here, "src/index.ts"),
    webpackOverride: (config) => {
      const previous = (config.resolve?.alias ?? {}) as Record<string, string>;
      const { "@": _dropped, ...rest } = previous;
      return { ...config, resolve: { ...config.resolve, alias: { ...rest, ...aliases } } };
    },
  });
  const browser = await openBrowser("chrome", { chromiumOptions: { gl: "angle" } });
  const fixturesDir = path.join(here, "fixtures");
  const slugs = fs
    .readdirSync(fixturesDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""))
    .filter((s) => only.length === 0 || only.includes(s))
    .sort();

  const summary: Record<string, unknown>[] = [];
  for (const slug of slugs) {
    const json = JSON.parse(fs.readFileSync(path.join(fixturesDir, `${slug}.json`), "utf8"));
    const comps = await Promise.all(
      SIDES.map((side) => selectComposition({ serveUrl, id: `${side}-${slug}`, puppeteerInstance: browser })),
    );
    const fixture: Fixture = { slug, durationInFrames: comps[0].durationInFrames, json };
    const rows: Buffer[] = [];
    const scores: Record<string, unknown>[] = [];
    for (const { frame, label: name } of framesFor(fixture)) {
      const files = SIDES.map((side) => path.join(outDir, `${slug}_${side.toLowerCase()}_${frame}.png`));
      for (const index of [0, 1]) {
        await renderStill({ serveUrl, composition: comps[index], frame, output: files[index], imageFormat: "png", puppeteerInstance: browser, overwrite: true });
      }
      // One fixed policy: every frame is scored against the warm reference.
      const { psnr, ssim, share, diff, width, height } = {
        ...ffmpegScores(files[0], files[1]),
        ...(await mismatch(files[0], files[1])),
      };
      let firstRender: Record<string, unknown> | undefined;
      if (frame === 0) {
        // Evidence only, never the score: lottie-web's frame 0 depends on what
        // it rendered before (see README.md, "Known lottie-web bugs"), so the
        // cold first paint is rendered and compared to the warm reference too.
        const cold = path.join(outDir, `${slug}_lottie-cold_0.png`);
        const coldComp = await selectComposition({ serveUrl, id: `Lottie-${slug}`, puppeteerInstance: browser });
        await renderStill({ serveUrl, composition: coldComp, frame: 0, output: cold, imageFormat: "png", puppeteerInstance: browser, overwrite: true });
        const coldVsWarm = { ...ffmpegScores(cold, files[0]), ...(await mismatch(cold, files[0])) };
        if (coldVsWarm.share > 0.002) {
          const genVsCold = { ...ffmpegScores(cold, files[1]), ...(await mismatch(cold, files[1])) };
          firstRender = {
            coldVsWarm: { psnr: +coldVsWarm.psnr.toFixed(2), mismatch: +(coldVsWarm.share * 100).toFixed(3) },
            genVsCold: { psnr: +genVsCold.psnr.toFixed(2), mismatch: +(genVsCold.share * 100).toFixed(3) },
          };
        }
      }
      const referenceBug = KNOWN_REFERENCE_BUGS[slug]?.frames.includes(frame) ?? false;
      scores.push({
        frame,
        name,
        psnr: Number.isFinite(psnr) ? +psnr.toFixed(2) : "inf",
        ssim: +ssim.toFixed(4),
        mismatch: +(share * 100).toFixed(3),
        ...(referenceBug ? { referenceBug: KNOWN_REFERENCE_BUGS[slug].bug } : {}),
        ...(firstRender ? { firstRender } : {}),
      });
      const tile = (input: Buffer | string, raw?: boolean) =>
        sharp(input, raw ? { raw: { width, height, channels: 3 } } : undefined).resize({ width: Math.min(width, 360) }).png().toBuffer();
      const tiles = await Promise.all([tile(files[0]), tile(files[1]), tile(diff, true)]);
      const tileMeta = await sharp(tiles[0]).metadata();
      const tw = tileMeta.width ?? 360;
      const th = tileMeta.height ?? 360;
      const caption = `f${frame} (${name}${referenceBug ? ", reference wrong: lottie-web bug" : ""})  PSNR ${Number.isFinite(psnr) ? psnr.toFixed(1) : "inf"} dB  SSIM ${ssim.toFixed(3)}  mismatch ${(share * 100).toFixed(2)}%`;
      rows.push(
        await sharp({ create: { width: tw * 3 + 8, height: th + 28, channels: 3, background: "#888" } })
          .composite([
            { input: label(caption, tw * 3 + 8), top: 0, left: 0 },
            { input: tiles[0], top: 28, left: 0 },
            { input: tiles[1], top: 28, left: tw + 4 },
            { input: tiles[2], top: 28, left: tw * 2 + 8 },
          ])
          .png()
          .toBuffer(),
      );
    }
    const rowMeta = await Promise.all(rows.map((r) => sharp(r).metadata()));
    const sheetWidth = Math.max(...rowMeta.map((m) => m.width ?? 0));
    const sheetHeight = rowMeta.reduce((s, m) => s + (m.height ?? 0) + 4, 28);
    let top = 28;
    const layers = [{ input: label(`${slug} — Lottie (lottie-web) | import-ae TSX | difference ×4`, sheetWidth), top: 0, left: 0 }];
    rows.forEach((r, i) => {
      layers.push({ input: r, top, left: 0 });
      top += (rowMeta[i].height ?? 0) + 4;
    });
    const sheet = path.join(outDir, `${slug}_sheet.png`);
    await sharp({ create: { width: sheetWidth, height: sheetHeight, channels: 3, background: "#444" } }).composite(layers).png().toFile(sheet);
    const psnrs = scores.map((s) => (typeof s.psnr === "number" ? s.psnr : 99));
    const entry = {
      slug,
      frames: scores,
      minPsnr: Math.min(...psnrs),
      referenceBugFrames: scores.filter((s) => s.referenceBug).map((s) => s.frame),
      firstRenderArtifact: scores.find((s) => s.firstRender)?.firstRender ?? null,
      meanSsim: +(scores.reduce((s, x) => s + Number(x.ssim), 0) / scores.length).toFixed(4),
      maxMismatch: Math.max(...scores.map((s) => Number(s.mismatch))),
      sheet: path.relative(appRoot, sheet),
    };
    summary.push(entry);
    console.log(`${slug}: min PSNR ${entry.minPsnr} dB, mean SSIM ${entry.meanSsim}, max mismatch ${entry.maxMismatch}%  → ${entry.sheet}`);
  }
  await browser.close({ silent: true });
  fs.writeFileSync(path.join(outDir, "results.json"), `${JSON.stringify(summary, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
