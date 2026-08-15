#!/usr/bin/env tsx
/**
 * Render an explicit frame list for a few slugs.
 *
 * `audit:stills` samples at 15/50/90% of every composition, which is the right
 * shape for "does this preview move at all" and the wrong shape for a
 * transition: the interesting frames are the handful either side of the cut,
 * and a defect that lives between two samples — a one-frame flash, a torn
 * seam — is invisible to a three-point sample.
 *
 * Usage:
 *   pnpm --filter web tsx scripts/audit-frames.mts --only transition-card-flip --frames 51,54,57,60,63,66,69
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { ensureBrowser, getCompositions, renderStill } from "@remotion/renderer";
import { resolveExportConfig } from "../lib/component-export.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");
const generatedDir = path.join(appRoot, "showcase", "export", ".generated");
const entryPath = path.join(appRoot, "showcase", "export", "src", "index.ts");

function parseArgs(argv: string[]) {
  const options = {
    out: "/tmp/frames",
    scale: 0.5,
    only: [] as string[],
    frames: [] as number[],
  };
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
      case "--frames":
        options.frames = argv[++index].split(",").map((frame) => Number(frame.trim()));
        break;
    }
  }
  return options;
}

const pascal = (slug: string) =>
  slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

/** Mirrors the alias block in remotion.config.js, which the bundler API does not apply. */
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
  if (options.only.length === 0 || options.frames.length === 0) {
    throw new Error("--only and --frames are both required");
  }

  const entries = options.only.map((slug) => ({
    slug,
    compositionId: pascal(slug),
    config: resolveExportConfig(appRoot, slug),
  }));

  fs.mkdirSync(generatedDir, { recursive: true });
  fs.writeFileSync(
    path.join(generatedDir, "RemotionRoot.tsx"),
    `import { Composition } from "remotion";
${entries
  .map(
    (entry, index) =>
      `import { ${entry.config.source.exportName} as C${index} } from "${entry.config.source.importPath}";`,
  )
  .join("\n")}

export const RemotionRoot: React.FC = () => {
  return (
    <>
${entries
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
  .join("\n")}
    </>
  );
};
`,
  );

  fs.mkdirSync(options.out, { recursive: true });
  const serveUrl = await bundle({ entryPoint: entryPath, webpackOverride });
  await ensureBrowser();

  const chromiumOptions = { gl: "angle" } as const;
  const composed = await getCompositions(serveUrl, { chromiumOptions });
  const byId = new Map(composed.map((item) => [item.id, item]));

  for (const entry of entries) {
    const composition = byId.get(entry.compositionId);
    if (!composition) {
      console.log(`${entry.slug}  MISSING`);
      continue;
    }
    for (const frame of options.frames) {
      const output = path.join(options.out, `${entry.slug}@f${frame}.png`);
      await renderStill({
        composition,
        serveUrl,
        output,
        frame,
        scale: options.scale,
        imageFormat: "png",
        overwrite: true,
        chromiumOptions,
      });
    }
    console.log(`${entry.slug}  ${options.frames.length} frames`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
