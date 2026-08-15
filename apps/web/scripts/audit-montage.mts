#!/usr/bin/env tsx
/**
 * Pack audit stills into review sheets.
 *
 * A full pass over 100+ components is only affordable if the stills arrive as a
 * handful of contact sheets rather than 300 separate files. Each sheet holds a
 * few components, one row per component: enter, hold, exit left to right.
 *
 * Usage:
 *   pnpm --filter web audit:montage
 *   pnpm --filter web audit:montage --stills /tmp/stills --out /tmp/sheets --rows 7
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const SAMPLE_POINTS = ["0.15", "0.5", "0.9"] as const;
const CELL_WIDTH = 420;
const CELL_HEIGHT = Math.round((CELL_WIDTH * 9) / 16);

type CliOptions = { stills: string; out: string; rows: number };

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = { stills: "/tmp/stills", out: "/tmp/sheets", rows: 7 };
  for (let index = 0; index < argv.length; index += 1) {
    switch (argv[index]) {
      case "--stills":
        options.stills = argv[++index];
        break;
      case "--out":
        options.out = argv[++index];
        break;
      case "--rows":
        options.rows = Number(argv[++index]);
        break;
    }
  }
  return options;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const report = JSON.parse(
    fs.readFileSync(path.join(options.stills, "report.json"), "utf8"),
  ) as { results: Array<{ slug: string; status: string; dead?: boolean }> };

  // Dead previews first: they are the defect class worth reviewing as a group.
  const slugs = report.results
    .filter((result) => result.status === "ok")
    .sort((a, b) => Number(b.dead ?? false) - Number(a.dead ?? false) || a.slug.localeCompare(b.slug))
    .map((result) => result.slug);

  fs.mkdirSync(options.out, { recursive: true });

  let sheet = 0;
  for (let start = 0; start < slugs.length; start += options.rows) {
    sheet += 1;
    const batch = slugs.slice(start, start + options.rows);
    const inputs: string[] = [];

    for (const slug of batch) {
      for (const point of SAMPLE_POINTS) {
        inputs.push(path.join(options.stills, `${slug}@${point}.png`));
      }
    }

    const missing = inputs.filter((file) => !fs.existsSync(file));
    if (missing.length > 0) {
      console.log(`sheet ${sheet}: skipping, ${missing.length} stills missing`);
      continue;
    }

    // Every cell is normalised to one box before tiling — the catalog mixes 16:9
    // and 9:16 compositions, and xstack refuses ragged inputs. Both dimensions
    // must be given: `scale=W:-1` lets a vertical still overflow the cell and pad
    // then fails outright.
    const scaled = inputs
      .map(
        (_, index) =>
          `[${index}:v]scale=${CELL_WIDTH}:${CELL_HEIGHT}:force_original_aspect_ratio=decrease,pad=${CELL_WIDTH}:${CELL_HEIGHT}:(ow-iw)/2:(oh-ih)/2:color=0x111111[c${index}]`,
      )
      .join(";");

    const tiles = inputs.map((_, index) => `[c${index}]`).join("");
    const output = path.join(options.out, `sheet-${String(sheet).padStart(2, "0")}.png`);

    const command = [
      "ffmpeg -y -hide_banner -loglevel error",
      inputs.map((file) => `-i ${JSON.stringify(file)}`).join(" "),
      `-filter_complex ${JSON.stringify(`${scaled};${tiles}xstack=inputs=${inputs.length}:layout=${layout(batch.length)}[out]`)}`,
      '-map "[out]"',
      JSON.stringify(output),
    ].join(" ");

    execSync(command, { stdio: "inherit" });
    console.log(`sheet ${sheet}: ${batch.join(", ")}`);
    fs.writeFileSync(
      output.replace(/\.png$/, ".txt"),
      batch.map((slug, row) => `row ${row + 1}: ${slug}`).join("\n"),
    );
  }

  console.log("");
  console.log(`${sheet} sheets in ${options.out}`);
}

/**
 * Three columns per row, one row per component. Offsets are literal pixels
 * because every cell was already padded to the same box — the `w0+w1` form
 * xstack also accepts is fragile once inputs vary.
 */
function layout(rows: number) {
  const cells: string[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      cells.push(`${column * CELL_WIDTH}_${row * CELL_HEIGHT}`);
    }
  }
  return cells.join("|");
}

main();
