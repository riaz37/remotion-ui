#!/usr/bin/env tsx
/** Render a fractional frame ladder per slug so a frozen tail is measurable. */
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

const out = process.argv[process.argv.indexOf("--out") + 1] ?? "/tmp/tail";
const slugs = process.argv[process.argv.indexOf("--only") + 1].split(",");
const durArg = process.argv.indexOf("--durations");
const durations: Record<string, number> = {};
if (durArg > -1) {
  for (const pair of process.argv[durArg + 1].split(",")) {
    const [slug, value] = pair.split("=");
    durations[slug] = Number(value);
  }
}
const FRACTIONS = [0.05, 0.15, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.97];

const pascal = (slug: string) =>
  slug.split("-").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");

function webpackOverride(config: Record<string, any>) {
  config.resolve ??= {};
  const previous = config.resolve.alias;
  const base =
    previous && typeof previous === "object" && !Array.isArray(previous) ? { ...previous } : {};
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

const entries = slugs.map((slug) => {
  const config = resolveExportConfig(appRoot, slug);
  return {
    slug,
    compositionId: pascal(slug),
    config: { ...config, durationInFrames: durations[slug] ?? config.durationInFrames },
  };
});

fs.mkdirSync(generatedDir, { recursive: true });
fs.writeFileSync(
  path.join(generatedDir, "RemotionRoot.tsx"),
  `import { Composition } from "remotion";
${entries.map((e, i) => `import { ${e.config.source.exportName} as C${i} } from "${e.config.source.importPath}";`).join("\n")}

export const RemotionRoot: React.FC = () => (
  <>
${entries
  .map(
    (e, i) => `    <Composition id="${e.compositionId}" component={C${i}} durationInFrames={${e.config.durationInFrames}} fps={${e.config.fps}} width={${e.config.width}} height={${e.config.height}} />`,
  )
  .join("\n")}
  </>
);
`,
);

fs.mkdirSync(out, { recursive: true });
const serveUrl = await bundle({ entryPoint: entryPath, webpackOverride });
await ensureBrowser();
const chromiumOptions = { gl: "angle" } as const;
const composed = await getCompositions(serveUrl, { chromiumOptions });
const byId = new Map(composed.map((c) => [c.id, c]));

for (const entry of entries) {
  const composition = byId.get(entry.compositionId);
  if (!composition) {
    console.log(`${entry.slug}  MISSING`);
    continue;
  }
  const total = entry.config.durationInFrames;
  for (const fraction of FRACTIONS) {
    const frame = Math.min(total - 1, Math.round(total * fraction));
    await renderStill({
      composition: { ...composition, durationInFrames: total },
      serveUrl,
      output: path.join(out, `${entry.slug}@p${Math.round(fraction * 100)}-f${frame}.png`),
      frame,
      scale: 0.5,
      imageFormat: "png",
      overwrite: true,
      chromiumOptions,
    });
  }
  console.log(`${entry.slug}  ${total}f  done`);
}
