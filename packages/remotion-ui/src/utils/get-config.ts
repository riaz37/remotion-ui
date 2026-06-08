import { cosmiconfig } from "cosmiconfig";
import path from "node:path";
import {
  remotionUiConfigSchema,
  type RemotionUiConfig,
} from "../schema/index.js";

const explorer = cosmiconfig("remotion-ui", {
  searchPlaces: ["remotion-ui.json", ".remotion-uirc", ".remotion-uirc.json"],
});

const CATEGORY_SEGMENTS: Array<{
  segment: string;
  key: keyof RemotionUiConfig["aliases"];
}> = [
  { segment: "/primitives/", key: "primitives" },
  { segment: "/scenes/", key: "scenes" },
  { segment: "/compositions/", key: "compositions" },
  { segment: "/lib/", key: "lib" },
  { segment: "/hooks/", key: "hooks" },
];

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
  filePath?: string,
): string | undefined {
  if (filePath) {
    const category = getCategoryFromPath(filePath);
    if (category) {
      return config.aliases[category.key];
    }
  }

  const map: Record<string, keyof RemotionUiConfig["aliases"]> = {
    "registry:ui": "primitives",
    "registry:lib": "lib",
    "registry:hook": "hooks",
    "registry:block": "scenes",
  };

  const key = map[type];
  return key ? config.aliases[key] : undefined;
}

export function getCategoryFromPath(filePath: string): {
  key: keyof RemotionUiConfig["aliases"];
  relativePath: string;
} | null {
  for (const { segment, key } of CATEGORY_SEGMENTS) {
    const index = filePath.indexOf(segment);
    if (index !== -1) {
      return {
        key,
        relativePath: filePath.slice(index + segment.length),
      };
    }
  }
  return null;
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

function assertInsideDirectory(
  baseDir: string,
  targetPath: string,
  label: string,
): void {
  const relative = path.relative(baseDir, targetPath);
  if (
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    throw new Error(
      `Resolved install path is outside the ${label}: ${targetPath}`,
    );
  }
}

export function resolveInstallPath(
  cwd: string,
  config: RemotionUiConfig,
  file: { path: string; type: string; target?: string },
): string {
  if (file.target) {
    const targetPath = path.resolve(cwd, file.target);
    assertInsideDirectory(cwd, targetPath, "project");
    return targetPath;
  }

  const category = getCategoryFromPath(file.path);
  if (category) {
    const baseDir = resolveAliasPath(cwd, config.aliases[category.key]);
    const targetPath = path.resolve(baseDir, category.relativePath);
    assertInsideDirectory(baseDir, targetPath, "install directory");
    assertInsideDirectory(cwd, targetPath, "project");
    return targetPath;
  }

  const alias = getAliasForType(config, file.type, file.path);
  if (!alias) {
    throw new Error(`No alias configured for registry type "${file.type}"`);
  }

  const baseDir = resolveAliasPath(cwd, alias);
  const fileName = path.basename(file.path);
  const targetPath = path.resolve(baseDir, fileName);
  assertInsideDirectory(baseDir, targetPath, "install directory");
  assertInsideDirectory(cwd, targetPath, "project");
  return targetPath;
}

export function isCompositionItem(files: Array<{ path: string }>): boolean {
  return files.some((file) => file.path.includes("/compositions/"));
}
