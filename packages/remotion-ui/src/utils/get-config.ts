import { cosmiconfig } from "cosmiconfig";
import path from "node:path";
import {
  remotionUiConfigSchema,
  type RemotionUiConfig,
} from "../schema/index.js";

const explorer = cosmiconfig("remotion-ui", {
  searchPlaces: [
    "remotion-ui.json",
    ".remotion-uirc",
    ".remotion-uirc.json",
  ],
});

export async function getConfig(cwd: string): Promise<RemotionUiConfig> {
  const result = await explorer.search(cwd);

  if (!result) {
    throw new Error(
      `No remotion-ui.json found in ${cwd}. Run "remotion-ui init" first.`,
    );
  }

  return remotionUiConfigSchema.parse(result.config);
}

export function getAliasForType(
  config: RemotionUiConfig,
  type: string,
): string | undefined {
  const map: Record<string, keyof RemotionUiConfig["aliases"]> = {
    "registry:ui": "primitives",
    "registry:lib": "lib",
    "registry:hook": "hooks",
  };

  const key = map[type];
  return key ? config.aliases[key] : undefined;
}

export function resolveAliasPath(cwd: string, alias: string): string {
  if (alias.startsWith("@/")) {
    return path.join(cwd, "src", alias.slice(2));
  }

  if (alias.startsWith("./") || alias.startsWith("../")) {
    return path.resolve(cwd, alias);
  }

  return path.join(cwd, alias);
}

export function resolveInstallPath(
  cwd: string,
  config: RemotionUiConfig,
  file: { path: string; type: string; target?: string },
): string {
  if (file.target) {
    return path.resolve(cwd, file.target);
  }

  const alias = getAliasForType(config, file.type);
  if (!alias) {
    throw new Error(`No alias configured for registry type "${file.type}"`);
  }

  const baseDir = resolveAliasPath(cwd, alias);
  const fileName = path.basename(file.path);
  return path.join(baseDir, fileName);
}
