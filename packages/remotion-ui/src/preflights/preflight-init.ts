import fs from "fs-extra";
import path from "node:path";
import { remotionUiConfigSchema } from "../schema/index.js";

const ROOT_CANDIDATES = [
  "src/Root.tsx",
  "src/root.tsx",
  "remotion/Root.tsx",
  "src/remotion/Root.tsx",
];

export async function bootstrapExistingProject(cwd: string): Promise<void> {
  const pkgPath = path.join(cwd, "package.json");
  if (!(await fs.pathExists(pkgPath))) {
    throw new Error(
      "No package.json found. Run this command from a Remotion project root.",
    );
  }

  const pkg = (await fs.readJson(pkgPath)) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };

  const remotionVersion =
    pkg.dependencies?.remotion ?? pkg.devDependencies?.remotion;

  if (!remotionVersion) {
    throw new Error(
      "This does not look like a Remotion project. remotion is missing from package.json.",
    );
  }

  const configPath = path.join(cwd, "remotion-ui.json");
  if (await fs.pathExists(configPath)) {
    throw new Error("remotion-ui.json already exists in this directory.");
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
  await ensureTsconfigPaths(cwd);

  console.log(`Created remotion-ui.json`);
  console.log(`Detected Remotion root: ${root}`);
  console.log(`\nNext step:`);
  console.log(`  npx remotion-ui add social-clip`);
}

async function detectRootPath(cwd: string): Promise<string> {
  for (const candidate of ROOT_CANDIDATES) {
    if (await fs.pathExists(path.join(cwd, candidate))) {
      return candidate;
    }
  }
  return "src/Root.tsx";
}

async function ensureTsconfigPaths(cwd: string): Promise<void> {
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
  tsconfig.compilerOptions.baseUrl ??= ".";
  tsconfig.compilerOptions.paths ??= {};

  if (!tsconfig.compilerOptions.paths["@/*"]) {
    tsconfig.compilerOptions.paths["@/*"] = ["src/*"];
    await fs.writeJson(tsconfigPath, tsconfig, { spaces: 2 });
    console.log('Added "@/*": ["src/*"] to tsconfig.json');
  }
}
