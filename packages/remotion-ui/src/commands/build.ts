import path from "node:path";
import { buildRegistry } from "../registry/build-registry.js";
import { toErrorJson } from "../utils/errors.js";

export type BuildOptions = {
  cwd?: string;
  outputDir?: string;
  preset?: string;
  json?: boolean;
};

export async function buildCommand(
  registryPath = "registry.json",
  options: BuildOptions = {},
): Promise<void> {
  const json = options.json ?? false;

  try {
    const cwd = path.resolve(options.cwd ?? process.cwd());
    const resolvedRegistry = path.resolve(cwd, registryPath);
    const outputDir =
      options.outputDir ??
      path.join(path.dirname(resolvedRegistry), "public", "r");

    if (!json) {
      console.log("Building registry...");
    }
    const result = await buildRegistry({
      registryPath: resolvedRegistry,
      outputDir,
      preset: options.preset,
    });

    if (json) {
      console.log(
        JSON.stringify({
          ok: true,
          itemCount: result.itemCount,
          outputDir: result.outputDir,
          filesWritten: result.items,
        }),
      );
    } else {
      console.log(`\nRegistry built: ${result.itemCount} item(s)`);
      console.log(`Output: ${result.outputDir}`);
    }
  } catch (error) {
    if (json) {
      console.log(JSON.stringify(toErrorJson(error)));
    }
    throw error;
  }
}
