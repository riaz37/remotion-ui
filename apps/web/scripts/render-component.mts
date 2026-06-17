#!/usr/bin/env tsx
/**
 * Render any registry component to MP4.
 *
 * Usage:
 *   pnpm render:component map-flight
 *   pnpm render:component map-flight --out ../../exports/map-flight.mp4
 *   pnpm render:component fade-in --duration 60 --width 1280 --height 720
 *   pnpm render:component map-flight --registry
 *   pnpm render:component --list
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  defaultOutputPath,
  listExportableSlugs,
  resolveExportConfig,
} from "../lib/component-export.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");
const generatedDir = path.join(appRoot, "showcase", "export", ".generated");
const entryPath = path.join(appRoot, "showcase", "export", "src", "index.ts");

type CliOptions = {
  slug?: string;
  out?: string;
  durationInFrames?: number;
  fps?: number;
  width?: number;
  height?: number;
  usePreview?: boolean;
  list?: boolean;
};

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {};
  const positional: string[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    switch (arg) {
      case "--out":
        options.out = argv[++index];
        break;
      case "--duration":
        options.durationInFrames = Number(argv[++index]);
        break;
      case "--fps":
        options.fps = Number(argv[++index]);
        break;
      case "--width":
        options.width = Number(argv[++index]);
        break;
      case "--height":
        options.height = Number(argv[++index]);
        break;
      case "--registry":
        options.usePreview = false;
        break;
      case "--preview":
        options.usePreview = true;
        break;
      case "--list":
        options.list = true;
        break;
      default:
        if (!arg.startsWith("-")) {
          positional.push(arg);
        }
        break;
    }
  }

  options.slug = positional[0];
  return options;
}

function writeGeneratedRoot(config: ReturnType<typeof resolveExportConfig>) {
  fs.mkdirSync(generatedDir, { recursive: true });

  const rootSource = `import { Composition } from "remotion";
import { ${config.source.exportName} } from "${config.source.importPath}";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="${config.compositionId}"
      component={${config.source.exportName}}
      durationInFrames={${config.durationInFrames}}
      fps={${config.fps}}
      width={${config.width}}
      height={${config.height}}
    />
  );
};
`;

  fs.writeFileSync(path.join(generatedDir, "RemotionRoot.tsx"), rootSource);
}

function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.list) {
    const registry = JSON.parse(
      fs.readFileSync(path.join(appRoot, "registry.json"), "utf8"),
    );
    const slugs = listExportableSlugs(registry.items);
    console.log(slugs.join("\n"));
    return;
  }

  if (!options.slug) {
    console.error(
      [
        "Usage: pnpm render:component <slug> [options]",
        "",
        "Options:",
        "  --out <path>         Output MP4 path (default: public/showcases/<slug>.mp4)",
        "  --duration <frames>  Composition length in frames",
        "  --fps <number>       Frames per second (default: 30)",
        "  --width <px>         Output width (default: 1920)",
        "  --height <px>        Output height (default: 1080)",
        "  --registry           Export raw registry component (skip docs preview wrapper)",
        "  --preview            Force docs preview wrapper",
        "  --list               Print renderable registry slugs",
      ].join("\n"),
    );
    process.exit(1);
  }

  const config = resolveExportConfig(appRoot, options.slug, {
    durationInFrames: options.durationInFrames,
    fps: options.fps,
    width: options.width,
    height: options.height,
    usePreview: options.usePreview,
  });

  const outputPath = path.resolve(appRoot, options.out ?? defaultOutputPath(options.slug));
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  writeGeneratedRoot(config);

  const renderArgs = [
    "remotion",
    "render",
    "--config=remotion.config.js",
    entryPath,
    config.compositionId,
    outputPath,
    ...config.renderFlags,
  ];

  console.log(
    [
      `Rendering ${options.slug}`,
      `  source: ${config.source.importPath} (${config.source.exportName})`,
      `  size: ${config.width}x${config.height} @ ${config.fps}fps`,
      `  duration: ${config.durationInFrames} frames`,
      `  output: ${outputPath}`,
      config.renderFlags.length > 0 ? `  flags: ${config.renderFlags.join(" ")}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  );
  console.log("");

  execSync(renderArgs.join(" "), {
    cwd: appRoot,
    stdio: "inherit",
    env: { ...process.env, FORCE_COLOR: "1" },
  });
}

main();
