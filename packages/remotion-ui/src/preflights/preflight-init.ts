import fs from "fs-extra";
import path from "node:path";
import { remotionUiConfigSchema } from "../schema/index.js";
import { RemotionUiError } from "../utils/errors.js";
import { getInstalledRemotionVersion } from "../utils/get-installed-remotion-version.js";

const ROOT_CANDIDATES = [
  "src/Root.tsx",
  "src/root.tsx",
  "remotion/Root.tsx",
  "src/remotion/Root.tsx",
];

export type BootstrapExistingProjectOptions = {
  json?: boolean;
};

export type BootstrapExistingProjectResult = {
  configPath: string;
  root: string;
};

export async function bootstrapExistingProject(
  cwd: string,
  options: BootstrapExistingProjectOptions = {},
): Promise<BootstrapExistingProjectResult> {
  const pkgPath = path.join(cwd, "package.json");
  if (!(await fs.pathExists(pkgPath))) {
    throw new RemotionUiError(
      "CONFIG_NOT_FOUND",
      "No package.json found. Run this command from a Remotion project root.",
    );
  }

  const remotionVersion = await getInstalledRemotionVersion(cwd);

  if (!remotionVersion) {
    throw new RemotionUiError(
      "CONFIG_INVALID",
      "This does not look like a Remotion project. remotion is missing from package.json.",
    );
  }

  const configPath = path.join(cwd, "remotion-ui.json");
  if (await fs.pathExists(configPath)) {
    throw new RemotionUiError(
      "TARGET_EXISTS",
      "remotion-ui.json already exists in this directory.",
    );
  }

  const root = await detectRootPath(cwd);
  const major = remotionVersion.replace(/[^0-9].*$/, "") || "4";

  const config = remotionUiConfigSchema.parse({
    $schema: "https://remotionui.com/schema.json",
    preset: "default",
    tsx: true,
    remotion: {
      version: major,
      config: (await fs.pathExists(path.join(cwd, "remotion.config.ts")))
        ? "remotion.config.ts"
        : "remotion.config.ts",
      root,
    },
    aliases: {
      primitives: "@/remotion/primitives",
      scenes: "@/remotion/scenes",
      compositions: "@/compositions",
      lib: "@/remotion/lib",
      hooks: "@/remotion/hooks",
    },
  });

  await fs.writeJson(configPath, config, { spaces: 2 });
  await ensureTsconfigPaths(cwd, options);

  if (!options.json) {
    console.log(`Created remotion-ui.json`);
    console.log(`Detected Remotion root: ${root}`);
    console.log(`\nNext step:`);
    console.log(`  npx remotion-ui add social-clip`);
  }

  return { configPath, root };
}

async function detectRootPath(cwd: string): Promise<string> {
  for (const candidate of ROOT_CANDIDATES) {
    if (await fs.pathExists(path.join(cwd, candidate))) {
      return candidate;
    }
  }
  return "src/Root.tsx";
}

async function ensureTsconfigPaths(
  cwd: string,
  options: BootstrapExistingProjectOptions = {},
): Promise<void> {
  const tsconfigPath = path.join(cwd, "tsconfig.json");
  if (!(await fs.pathExists(tsconfigPath))) {
    return;
  }

  const tsconfig = (await fs.readJson(tsconfigPath)) as {
    compilerOptions?: {
      baseUrl?: string;
      paths?: Record<string, string[]>;
    };
  };

  tsconfig.compilerOptions ??= {};
  tsconfig.compilerOptions.paths ??= {};

  if (!tsconfig.compilerOptions.paths["@/*"]) {
    // `baseUrl` is removed in TypeScript 7, so never add one. Without it a
    // path pattern resolves relative to the tsconfig itself; with one the
    // project already has, patterns stay relative to that baseUrl.
    tsconfig.compilerOptions.paths["@/*"] = tsconfig.compilerOptions.baseUrl
      ? ["src/*"]
      : ["./src/*"];
    await fs.writeJson(tsconfigPath, tsconfig, { spaces: 2 });
    if (!options.json) {
      console.log('Added "@/*": ["src/*"] to tsconfig.json');
    }
  }
}
