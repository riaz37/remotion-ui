import { execSync } from "node:child_process";
import path from "node:path";
import { fetchRegistryItem } from "../registry/fetch-item.js";
import {
  getConfig,
  resolveInstallPath,
} from "../utils/get-config.js";
import {
  detectPackageManager,
  getInstallCommand,
} from "../utils/get-package-manager.js";
import { writeFile } from "../utils/index.js";

export type AddOptions = {
  cwd?: string;
  registryUrl?: string;
  preset?: string;
  yes?: boolean;
};

export async function addCommand(
  components: string[],
  options: AddOptions = {},
): Promise<void> {
  if (components.length === 0) {
    throw new Error("Please specify at least one component to add.");
  }

  const cwd = path.resolve(options.cwd ?? process.cwd());
  const config = await getConfig(cwd);
  const installed = new Set<string>();
  const dependencies = new Set<string>();

  for (const name of components) {
    await installComponent(name, {
      cwd,
      config,
      registryUrl: options.registryUrl,
      preset: options.preset ?? config.preset,
      installed,
      dependencies,
    });
  }

  if (dependencies.size > 0) {
    const pm = await detectPackageManager(cwd);
    const cmd = getInstallCommand(pm, [...dependencies]);
    console.log(`Installing dependencies: ${[...dependencies].join(", ")}`);
    execSync(cmd, { cwd, stdio: "inherit" });
  }

  console.log(`\nAdded ${components.length} component(s) successfully.`);
}

async function installComponent(
  name: string,
  ctx: {
    cwd: string;
    config: Awaited<ReturnType<typeof getConfig>>;
    registryUrl?: string;
    preset: string;
    installed: Set<string>;
    dependencies: Set<string>;
  },
): Promise<void> {
  if (ctx.installed.has(name)) {
    return;
  }

  const item = await fetchRegistryItem(name, {
    registryUrl: ctx.registryUrl,
    preset: ctx.preset,
  });

  for (const dep of item.registryDependencies ?? []) {
    await installComponent(dep, ctx);
  }

  for (const file of item.files) {
    if (!file.content) {
      throw new Error(
        `Registry item "${name}" is missing content for ${file.path}`,
      );
    }

    const targetPath = resolveInstallPath(ctx.cwd, ctx.config, file);
    await writeFile(targetPath, file.content);
    console.log(`  ✓ ${path.relative(ctx.cwd, targetPath)}`);
  }

  for (const dep of item.dependencies ?? []) {
    ctx.dependencies.add(dep);
  }

  ctx.installed.add(name);
}
