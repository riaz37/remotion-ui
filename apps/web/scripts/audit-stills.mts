#!/usr/bin/env tsx
/**
 * Batch-render three stills per registry component for the preview audit.
 *
 * One webpack bundle and one browser cover the whole catalog — the per-component
 * `render:component` path boots a browser each time, which is far too slow to
 * audit 100+ slugs.
 *
 * Usage:
 *   pnpm --filter web audit:stills
 *   pnpm --filter web audit:stills --out /tmp/stills --scale 0.5
 *   pnpm --filter web audit:stills --only fade-in,map-flight
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import {
  ensureBrowser,
  getCompositions,
  renderStill,
} from "@remotion/renderer";
import { listExportableSlugs, resolveExportConfig } from "../lib/component-export.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");
const generatedDir = path.join(appRoot, "showcase", "export", ".generated");
const entryPath = path.join(appRoot, "showcase", "export", "src", "index.ts");

/** Enter / hold / exit, as fractions of each composition's own length. */
const SAMPLE_POINTS = [0.15, 0.5, 0.9] as const;

type CliOptions = { out: string; scale: number; only?: string[] };

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = { out: "/tmp/stills", scale: 0.5 };
  for (let index = 0; index < argv.length; index += 1) {
    switch (argv[index]) {
      case "--out":
        options.out = argv[++index];
        break;
      case "--scale":
        options.scale = Number(argv[++index]);
        break;
      case "--only":
        options.only = argv[++index].split(",").map((slug) => slug.trim());
        break;
    }
  }
  return options;
}

function pascal(slug: string) {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

type Entry = {
  slug: string;
  compositionId: string;
  config: ReturnType<typeof resolveExportConfig>;
};

/**
 * Compositions are keyed by slug rather than by the component's export name:
 * several components share an export name across registry and preview files,
 * and a single root cannot carry two compositions with the same id.
 */
function writeGeneratedRoot(entries: Entry[]) {
  fs.mkdirSync(generatedDir, { recursive: true });

  const imports = entries
    .map(
      (entry, index) =>
        `import { ${entry.config.source.exportName} as C${index} } from "${entry.config.source.importPath}";`,
    )
    .join("\n");

  const compositions = entries
    .map(
      (entry, index) => `    <Composition
      id="${entry.compositionId}"
      component={C${index}}
      durationInFrames={${entry.config.durationInFrames}}
      fps={${entry.config.fps}}
      width={${entry.config.width}}
      height={${entry.config.height}}
    />`,
    )
    .join("\n");

  fs.writeFileSync(
    path.join(generatedDir, "RemotionRoot.tsx"),
    `import { Composition } from "remotion";
${imports}

export const RemotionRoot: React.FC = () => {
  return (
    <>
${compositions}
    </>
  );
};
`,
  );
}

/**
 * PSNR in dB between two stills. Byte-comparing PNGs is useless here — a frame
 * that looks static still re-encodes a few bytes differently — so D6 needs a
 * perceptual measure. Above ~38 dB the two frames are indistinguishable.
 */
const STATIC_PSNR_DB = 38;

function measurePsnr(a: string, b: string): number {
  // ffmpeg prints the psnr summary on stderr, so fold it into stdout.
  const command = `ffmpeg -hide_banner -i ${JSON.stringify(a)} -i ${JSON.stringify(b)} -filter_complex psnr -f null - 2>&1`;
  let output = "";
  try {
    output = execSync(command, { encoding: "utf8" });
  } catch (error) {
    output = (error as { stdout?: string }).stdout ?? "";
  }
  const match = output.match(/average:([0-9.]+|inf)/);
  if (!match) return Number.NaN;
  return match[1] === "inf" ? Number.POSITIVE_INFINITY : Number(match[1]);
}

/** Mirrors the alias block in remotion.config.js, which the CLI applies and the bundler API does not. */
function webpackOverride(config: Record<string, any>) {
  config.resolve ??= {};
  const previous = config.resolve.alias;
  const base =
    previous && typeof previous === "object" && !Array.isArray(previous)
      ? { ...previous }
      : {};
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

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const registry = JSON.parse(
    fs.readFileSync(path.join(appRoot, "registry.json"), "utf8"),
  );

  const slugs = listExportableSlugs(registry.items).filter(
    (slug: string) => !options.only || options.only.includes(slug),
  );

  const entries: Entry[] = [];
  const resolveFailures: Array<{ slug: string; error: string }> = [];

  for (const slug of slugs) {
    try {
      entries.push({
        slug,
        compositionId: pascal(slug),
        config: resolveExportConfig(appRoot, slug),
      });
    } catch (error) {
      resolveFailures.push({ slug, error: (error as Error).message });
    }
  }

  console.log(`Resolved ${entries.length} of ${slugs.length} slugs`);
  if (resolveFailures.length > 0) {
    console.log(`  ${resolveFailures.length} failed to resolve`);
  }

  writeGeneratedRoot(entries);
  fs.mkdirSync(options.out, { recursive: true });

  console.log("Bundling once for the whole catalog...");
  const serveUrl = await bundle({
    entryPoint: entryPath,
    webpackOverride,
    onProgress: (percent) => {
      if (percent % 25 === 0) console.log(`  bundle ${percent}%`);
    },
  });

  await ensureBrowser();

  // ANGLE is required by the WebGL components and is harmless for the rest, so
  // one browser configuration covers the catalog.
  const chromiumOptions = { gl: "angle" } as const;
  const composed = await getCompositions(serveUrl, { chromiumOptions });
  const byId = new Map(composed.map((item) => [item.id, item]));

  const results: Array<{
    slug: string;
    status: "ok" | "error";
    error?: string;
    frames?: number[];
    /** PSNR enter→hold and hold→exit. Both above the threshold means nothing moves. */
    psnr?: number[];
    dead?: boolean;
    sizes?: number[];
  }> = [];

  let index = 0;
  for (const entry of entries) {
    index += 1;
    const composition = byId.get(entry.compositionId);
    if (!composition) {
      results.push({
        slug: entry.slug,
        status: "error",
        error: `composition ${entry.compositionId} missing from bundle`,
      });
      continue;
    }

    const frames = SAMPLE_POINTS.map((point) =>
      Math.min(
        composition.durationInFrames - 1,
        Math.floor(composition.durationInFrames * point),
      ),
    );

    try {
      const written: string[] = [];
      for (let sample = 0; sample < frames.length; sample += 1) {
        const output = path.join(
          options.out,
          `${entry.slug}@${SAMPLE_POINTS[sample]}.png`,
        );
        await renderStill({
          composition,
          serveUrl,
          output,
          frame: frames[sample],
          scale: options.scale,
          imageFormat: "png",
          overwrite: true,
          chromiumOptions,
        });
        written.push(output);
      }

      const psnr = [
        measurePsnr(written[0], written[1]),
        measurePsnr(written[1], written[2]),
      ];
      const dead = psnr.every((value) => value >= STATIC_PSNR_DB);

      results.push({
        slug: entry.slug,
        status: "ok",
        frames,
        psnr: psnr.map((value) => (Number.isFinite(value) ? value : 99)),
        dead,
        sizes: written.map((file) => fs.statSync(file).size),
      });
      console.log(
        `[${index}/${entries.length}] ${entry.slug}  psnr ${psnr.map((v) => (Number.isFinite(v) ? v.toFixed(1) : "inf")).join("/")}${dead ? "  DEAD" : ""}`,
      );
    } catch (error) {
      results.push({
        slug: entry.slug,
        status: "error",
        error: (error as Error).message.split("\n")[0],
      });
      console.log(`[${index}/${entries.length}] ${entry.slug}  ERROR`);
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    total: slugs.length,
    rendered: results.filter((result) => result.status === "ok").length,
    errors: results.filter((result) => result.status === "error"),
    dead: results.filter((result) => result.dead).map((result) => result.slug),
    resolveFailures,
    results,
  };

  fs.writeFileSync(
    path.join(options.out, "report.json"),
    JSON.stringify(report, null, 2),
  );

  console.log("");
  console.log(`rendered ${report.rendered}/${report.total}`);
  console.log(`errors   ${report.errors.length}`);
  console.log(`dead     ${report.dead.length}`);
  console.log(`report   ${path.join(options.out, "report.json")}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
