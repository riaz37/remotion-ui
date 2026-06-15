import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { BRAND_MARK_SVG, BRAND_OG_SVG } from "../lib/brand-mark-svg.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, "..");
const publicDir = path.join(webRoot, "public");

async function writePng(
  svg: string,
  outPath: string,
  width: number,
  height?: number,
) {
  const pipeline = sharp(Buffer.from(svg));
  if (height !== undefined) {
    await pipeline.resize(width, height).png().toFile(outPath);
  } else {
    await pipeline.resize(width, width).png().toFile(outPath);
  }
  console.log(`  ✓ ${path.relative(webRoot, outPath)}`);
}

async function main() {
  console.log("Generating Edit Bay brand assets…");

  await writePng(BRAND_MARK_SVG, path.join(publicDir, "icon-512.png"), 512);
  await writePng(BRAND_MARK_SVG, path.join(publicDir, "apple-icon.png"), 180);
  await writePng(BRAND_OG_SVG, path.join(publicDir, "og.png"), 1200, 630);

  writeFileSync(path.join(publicDir, "logo.svg"), BRAND_MARK_SVG.trim() + "\n");

  console.log("Done.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
