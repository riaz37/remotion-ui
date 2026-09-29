#!/usr/bin/env tsx
/**
 * Evidence strips for the known lottie-web bugs listed in README.md: frame 0
 * as lottie-web draws it on a page's first paint (cold), after it has drawn
 * another frame (warm, the bench reference), and as import-ae draws it.
 *
 *   cd apps/web && npx tsx showcase/import-ae-bench/evidence.mts   (after compare.mts)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(here, "out");
const evidenceDir = path.join(here, "evidence");
const SLUGS = ["repeater-animated", "zig-zag-animated"];
const TILE = 300;

const label = (text: string, width: number) =>
  Buffer.from(
    `<svg width="${width}" height="26"><rect width="100%" height="100%" fill="#111"/><text x="8" y="18" font-family="Helvetica, Arial" font-size="13" fill="#fff">${text}</text></svg>`,
  );

fs.mkdirSync(evidenceDir, { recursive: true });
for (const slug of SLUGS) {
  const panels = [
    { file: `${slug}_lottie-cold_0.png`, caption: "lottie-web, first paint (cold)" },
    { file: `${slug}_lottiewarm_0.png`, caption: "lottie-web, after frame 1 (warm)" },
    { file: `${slug}_gen_0.png`, caption: "import-ae" },
  ];
  const tiles = await Promise.all(
    panels.map((p) => sharp(path.join(outDir, p.file)).resize({ width: TILE }).png().toBuffer()),
  );
  const height = (await sharp(tiles[0]).metadata()).height ?? TILE;
  const width = TILE * 3 + 8;
  const target = path.join(evidenceDir, `${slug}_frame0.png`);
  await sharp({ create: { width, height: height + 52, channels: 3, background: "#888" } })
    .composite([
      { input: label(`${slug}, frame 0`, width), top: 0, left: 0 },
      ...panels.flatMap((p, i) => [
        { input: label(p.caption, TILE), top: 26, left: i * (TILE + 4) },
        { input: tiles[i], top: 52, left: i * (TILE + 4) },
      ]),
    ])
    .png()
    .toFile(target);
  console.log(path.relative(here, target));
}
