/**
 * Resolves every `fontSize: n * u` in the registry against the docs stage and
 * reports the ones that land under the D1 legibility floor.
 *
 * Scene type is authored in abstract units against a reference frame and scaled
 * by `u` at render time. That indirection is what let the catalog drift: a
 * "15 unit" label looks fine in the source and resolves to 11px on the 960-wide
 * docs stage, which the contact sheet then reduces 3.1x to a 308px tile — 3.6px,
 * well past the point where type is a texture rather than words.
 *
 * The floor is 18 units at u = 0.75, i.e. 13.5px on the stage. Anything under it
 * has to be a deliberate, commented exception: type that stands for interface
 * chrome inside a device mockup rather than copy the viewer is meant to read, or
 * a label whose container is too narrow to hold it at the floor, where meeting
 * the floor would truncate the word instead of enlarging it.
 *
 * Run: `pnpm --filter web scan:legibility` (add `--json` for machine-readable output).
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCAN_DIR = "registry/bases/default";

/** The composition the docs previews are laid out against. */
const STAGE_WIDTH = 960;
const STAGE_HEIGHT = 540;
/** Mirrors `getSafeAreaPadding` — 80/100 at a 1080 reference. */
const SAFE_X = Math.round((80 / 1080) * STAGE_WIDTH);
const SAFE_Y = Math.round((100 / 1080) * STAGE_HEIGHT);

/** 18 units at u = 0.75. */
export const LEGIBILITY_FLOOR_PX = 13.5;

/**
 * Sites that are under the floor on purpose. Each one is commented at the site
 * itself; this list is the machine-readable half of that decision.
 */
const EXCEPTIONS = new Set([
  // A day cell is ~78px on the stage. At the floor "Design review" clips to
  // "Design revie", and a truncated word is less legible than a small whole one.
  "scenes/calendar-month-fill/index.tsx",
]);

export type SmallType = {
  file: string;
  line: number;
  expr: string;
  px: number;
};

function listFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(path.join(appRoot, dir), { withFileTypes: true })) {
    const next = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(next));
    else if (next.endsWith(".tsx")) out.push(next);
  }
  return out;
}

/**
 * The landscape branch of a file's own `u`. Scenes declare it as a ternary on
 * orientation; the landscape arm is the last `Math.min` in the declaration.
 */
function resolveUnit(source: string): number | null {
  const declaration = source.match(/const u =[\s\S]{0,320}?;/);
  if (!declaration) return null;
  const branches = [
    ...declaration[0].matchAll(
      /Math\.min\(\s*(?:width|stage\.w) \/ (\d+),\s*(?:height|stage\.h) \/ (\d+)\)/g,
    ),
  ];
  const landscape = branches.at(-1);
  if (!landscape) return null;

  const onStage = landscape[0].includes("stage.w");
  const availableWidth = onStage ? STAGE_WIDTH - SAFE_X * 2 : STAGE_WIDTH;
  const availableHeight = onStage ? STAGE_HEIGHT - SAFE_Y * 2 : STAGE_HEIGHT;
  return Math.min(
    availableWidth / Number(landscape[1]),
    availableHeight / Number(landscape[2]),
  );
}

export function scanLegibility(): { resolved: number; under: SmallType[] } {
  let resolved = 0;
  const under: SmallType[] = [];

  for (const file of listFiles(SCAN_DIR)) {
    const source = readFileSync(path.join(appRoot, file), "utf8");
    const unit = resolveUnit(source);
    if (unit === null) continue;

    for (const match of source.matchAll(/fontSize:\s*([\d.]+)\s*\*\s*u/g)) {
      resolved += 1;
      const px = Number(match[1]) * unit;
      if (px >= LEGIBILITY_FLOOR_PX) continue;
      const relative = file.slice(`${SCAN_DIR}/`.length);
      if (EXCEPTIONS.has(relative)) continue;
      under.push({
        file,
        line: source.slice(0, match.index).split("\n").length,
        expr: match[0],
        px,
      });
    }
  }

  return { resolved, under };
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  const scan = scanLegibility();

  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(scan, null, 2));
  } else {
    console.log(`unit-scaled fontSize sites  ${scan.resolved}`);
    console.log(`under the ${LEGIBILITY_FLOOR_PX}px floor        ${scan.under.length}\n`);
    for (const site of scan.under) {
      console.log(`${site.px.toFixed(1)}px  ${site.file}:${site.line}  ${site.expr}`);
    }
  }

  if (scan.under.length > 0) process.exit(1);
}
