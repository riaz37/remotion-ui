import { execFileSync } from "node:child_process";
import path from "node:path";
import { patchRootTsx } from "../remotion/composition-patch.js";
import { fetchRegistryItem } from "../registry/fetch-item.js";
import {
  getConfig,
  isCompositionItem,
  resolveInstallPath,
} from "../utils/get-config.js";
import {
  detectPackageManager,
  getInstallCommand,
} from "../utils/get-package-manager.js";
import { preflightAdd } from "../preflights/preflight-add.js";
import { writeFile } from "../utils/index.js";
import { printStarPrompt } from "../utils/star-prompt.js";

export type AddOptions = {
  cwd?: string;
  registryUrl?: string;
  preset?: string;
  yes?: boolean;
  recipe?: string;
  showStarPrompt?: boolean;
};

export async function addCommand(
  components: string[],
  options: AddOptions = {},
): Promise<void> {
  let names = components;

  if (options.recipe) {
    const { fetchRecipeBySlug } = await import("../registry/fetch-recipes.js");
    const recipe = await fetchRecipeBySlug(options.recipe, options.registryUrl);
    if (!recipe) {
      throw new Error(`Recipe not found: ${options.recipe}`);
    }
    console.log(`Installing recipe: ${recipe.title}`);
    console.log(`  ${recipe.intent}`);
    names = recipe.components;
  }

  if (names.length === 0) {
    throw new Error("Please specify at least one component to add.");
  }

  const cwd = path.resolve(options.cwd ?? process.cwd());
  await preflightAdd(cwd);
  const config = await getConfig(cwd);
  const installed = new Set<string>();
  const dependencies = new Set<string>();

  for (const name of names) {
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
    const { command, args } = getInstallCommand(pm, [...dependencies]);
    console.log(`Installing dependencies: ${[...dependencies].join(", ")}`);
    execFileSync(command, args, { cwd, stdio: "inherit" });
  }

  console.log(`\nAdded ${names.length} component(s) successfully.`);

  if (options.showStarPrompt !== false) {
    printStarPrompt();
  }
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

  if (item.composition && isCompositionItem(item.files)) {
    const rootPath = path.resolve(ctx.cwd, ctx.config.remotion.root);
    await patchRootTsx(rootPath, {
      ...item.composition,
      importPath: item.composition.importPath ?? `@/compositions/${name}/index`,
    });
  }

  for (const dep of item.dependencies ?? []) {
    ctx.dependencies.add(dep);
  }

  ctx.installed.add(name);
}
