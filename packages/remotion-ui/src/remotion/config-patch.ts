import fs from "fs-extra";
import path from "node:path";

/**
 * `Config.overrideBundlerConfig` (applies to both Webpack and Rspack) first
 * shipped in Remotion 4.0.499. Older versions only bundle with Webpack, so
 * `overrideWebpackConfig` is enough there.
 */
const BUNDLER_OVERRIDE_MIN: readonly [number, number, number] = [4, 0, 499];

export type ConfigPatchStatus = "added" | "created" | "present" | "manual";

export type ConfigPatchResult = {
  status: ConfigPatchStatus;
  source: string;
};

const PATH_IMPORT = 'import path from "node:path";';
const CONFIG_IMPORT = 'import { Config } from "@remotion/cli/config";';

export const REMOTION_CONFIG_FILES = [
  "remotion.config.ts",
  "remotion.config.js",
  "remotion.config.mjs",
  "remotion.config.cjs",
] as const;

const ALIAS_PRESENT = /alias[\s\S]{0,80}["']@["']/;
const ANY_OVERRIDE = /\boverride(Webpack|Rspack|Bundler)Config\b/;
const PATH_BOUND =
  /import\s+(\*\s+as\s+)?path\b[^;]*from\s+["'](node:)?path["']|\b(const|let|var)\s+path\s*=/;
const PATH_MODULE_USED = /["'](node:)?path["']/;
const COMMONJS = /\brequire\s*\(/;

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

/** Inserts `line` before the first import, keeping shebangs and directives on top. */
function insertImport(source: string, line: string): string {
  const firstImport = source.search(/^import\s/m);
  if (firstImport >= 0) {
    return `${source.slice(0, firstImport)}${line}\n${source.slice(firstImport)}`;
  }
  const prologue = source.match(/^(#!.*\n)?(\s*["']use [a-z]+["'];?\s*\n)*/);
  const at = prologue ? prologue[0].length : 0;
  return `${source.slice(0, at)}${line}\n${source.slice(at)}`;
}

export function supportsBundlerOverride(version: string | undefined): boolean {
  const match = version?.match(/(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    return true;
  }
  const parts = match.slice(1, 4).map(Number);
  for (let i = 0; i < 3; i++) {
    if (parts[i] !== BUNDLER_OVERRIDE_MIN[i]) {
      return parts[i] > BUNDLER_OVERRIDE_MIN[i];
    }
  }
  return true;
}

export function aliasSnippet(version: string | undefined): string {
  const method = supportsBundlerOverride(version)
    ? "overrideBundlerConfig"
    : "overrideWebpackConfig";
  return `// Resolve RemotionUI's "@/..." imports (mirrors "paths" in tsconfig.json).
Config.${method}((currentConfiguration) => {
  currentConfiguration.resolve ??= {};
  currentConfiguration.resolve.alias ??= {};
  currentConfiguration.resolve.alias["@"] = path.resolve("./src");
  return currentConfiguration;
});
`;
}

/**
 * Returns a remotion.config.ts that makes the bundler resolve `@/*` to
 * `./src/*`. Pure: never touches disk. A config that already overrides the
 * bundler is left alone ("manual"), because Remotion keeps only the last
 * override and appending ours would silently drop the user's.
 */
export function patchRemotionConfigSource(
  source: string | undefined,
  version: string | undefined,
): ConfigPatchResult {
  const snippet = aliasSnippet(version);

  if (source === undefined) {
    return {
      status: "created",
      source: `${PATH_IMPORT}\n${CONFIG_IMPORT}\n\n${snippet}`,
    };
  }

  const code = stripComments(source);

  if (ALIAS_PRESENT.test(code)) {
    return { status: "present", source };
  }

  const pathBound = PATH_BOUND.test(code);
  if (
    ANY_OVERRIDE.test(code) ||
    COMMONJS.test(code) ||
    (!pathBound && PATH_MODULE_USED.test(code))
  ) {
    return { status: "manual", source };
  }

  const withImport = pathBound ? source : insertImport(source, PATH_IMPORT);
  const separator = withImport.endsWith("\n") ? "\n" : "\n\n";

  return { status: "added", source: `${withImport}${separator}${snippet}` };
}

/** Prefers the installed version over the package.json range, which can be ">=4.0.0". */
async function resolveRemotionVersion(
  cwd: string,
  fallback: string | undefined,
): Promise<string | undefined> {
  const installed = path.join(cwd, "node_modules", "remotion", "package.json");
  try {
    const pkg = (await fs.readJson(installed)) as { version?: unknown };
    return typeof pkg.version === "string" ? pkg.version : fallback;
  } catch {
    return fallback;
  }
}

export type BundlerAliasResult = {
  status: ConfigPatchStatus;
  configFile: string;
  version: string | undefined;
};

/**
 * Patches the project's Remotion config. Only a TypeScript config is edited or
 * created; a .js/.mjs/.cjs config is reported "manual" so the snippet can be
 * printed instead of adding a second config file Remotion would not load.
 */
export async function ensureBundlerAlias(
  cwd: string,
  rangeVersion: string | undefined,
): Promise<BundlerAliasResult> {
  const version = await resolveRemotionVersion(cwd, rangeVersion);
  let configFile: string = REMOTION_CONFIG_FILES[0];
  for (const candidate of REMOTION_CONFIG_FILES) {
    if (await fs.pathExists(path.join(cwd, candidate))) {
      configFile = candidate;
      break;
    }
  }
  const configPath = path.join(cwd, configFile);
  const existing = (await fs.pathExists(configPath))
    ? await fs.readFile(configPath, "utf-8")
    : undefined;

  if (existing !== undefined && !configFile.endsWith(".ts")) {
    const present = ALIAS_PRESENT.test(stripComments(existing));
    return { status: present ? "present" : "manual", configFile, version };
  }

  const result = patchRemotionConfigSource(existing, version);

  if (result.status === "added" || result.status === "created") {
    await fs.writeFile(configPath, result.source);
  }

  return { status: result.status, configFile, version };
}
