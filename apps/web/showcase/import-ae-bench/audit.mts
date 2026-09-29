#!/usr/bin/env tsx
/**
 * Guards the comparison against a false pass: for every rendered still, the
 * share of non-background pixels (blank-vs-blank scores perfectly), and
 * whether a fixture's frames actually change over time.
 *
 *   cd apps/web && npx tsx showcase/import-ae-bench/audit.mts   (after compare.mts)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "out");
const results = JSON.parse(fs.readFileSync(path.join(outDir, "results.json"), "utf8")) as {
  slug: string;
  frames: { frame: number }[];
}[];

async function pixels(file: string) {
  return sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
}

for (const { slug, frames } of results) {
  const coverage: string[] = [];
  let previous: Buffer | null = null;
  let changes = 0;
  for (const { frame } of [...frames].sort((a, b) => a.frame - b.frame)) {
    const { data, info } = await pixels(path.join(outDir, `${slug}_gen_${frame}.png`));
    const bg = [data[0], data[1], data[2]];
    let ink = 0;
    for (let i = 0; i < info.width * info.height; i += 1) {
      if (Math.abs(data[i * 3] - bg[0]) + Math.abs(data[i * 3 + 1] - bg[1]) + Math.abs(data[i * 3 + 2] - bg[2]) > 30) ink += 1;
    }
    coverage.push(`${frame}:${((ink / (info.width * info.height)) * 100).toFixed(1)}%`);
    if (previous && !previous.equals(data)) changes += 1;
    previous = data;
  }
  console.log(`${slug}: ink ${coverage.join(" ")} | frame-to-frame changes ${changes}/${frames.length - 1}`);
}
