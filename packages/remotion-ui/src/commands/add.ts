import { execFileSync } from "node:child_process";
import path from "node:path";
import semver from "semver";
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
import { RemotionUiError, toErrorJson } from "../utils/errors.js";
import { getInstalledRemotionVersion } from "../utils/get-installed-remotion-version.js";

export type AddOptions = {
  cwd?: string;
  registryUrl?: string;
  preset?: string;
  yes?: boolean;
  showStarPrompt?: boolean;
  json?: boolean;
};

export async function addCommand(
  components: string[],
  options: AddOptions = {},
): Promise<void> {
  const json = options.json ?? false;

  try {
    const names = components;

    if (names.length === 0) {
      throw new RemotionUiError(
        "INVALID_ARGS",
        "Please specify at least one component to add.",
      );
    }

    const cwd = path.resolve(options.cwd ?? process.cwd());
    await preflightAdd(cwd);
    const config = await getConfig(cwd);
    const installed = new Set<string>();
    const dependencies = new Set<string>();
    const installedRemotionVersion = await getInstalledRemotionVersion(cwd);

    for (const name of names) {
      await installComponent(name, {
        cwd,
        config,
        registryUrl: options.registryUrl,
        preset: options.preset ?? config.preset,
        installed,
        dependencies,
        json,
        installedRemotionVersion,
      });
    }

    if (dependencies.size > 0) {
      const pm = await detectPackageManager(cwd);
      const { command, args } = getInstallCommand(pm, [...dependencies]);
      if (!json) {
        console.log(`Installing dependencies: ${[...dependencies].join(", ")}`);
      }
      execFileSync(command, args, {
        cwd,
        stdio: json ? "pipe" : "inherit",
      });
    }

    if (json) {
      console.log(
        JSON.stringify({
          ok: true,
          installed: [...installed],
          dependencies: [...dependencies],
        }),
      );
    } else {
      console.log(`\nAdded ${names.length} component(s) successfully.`);

      if (options.showStarPrompt !== false) {
        printStarPrompt();
      }
    }
  } catch (error) {
    if (json) {
      console.log(JSON.stringify(toErrorJson(error)));
    }
    throw error;
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
    json: boolean;
    installedRemotionVersion?: string;
  },
): Promise<void> {
  if (ctx.installed.has(name)) {
    return;
  }

  const item = await fetchRegistryItem(name, {
    registryUrl: ctx.registryUrl,
    preset: ctx.preset,
  });

  warnOnCompatMismatch(item, ctx.installedRemotionVersion);

  for (const dep of item.registryDependencies ?? []) {
    await installComponent(dep, ctx);
  }

  for (const file of item.files) {
    if (!file.content) {
      throw new RemotionUiError(
        "REGISTRY_ITEM_INVALID",
        `Registry item "${name}" is missing content for ${file.path}`,
      );
    }

    const targetPath = resolveInstallPath(ctx.cwd, ctx.config, file);
    await writeFile(targetPath, file.content);
    if (!ctx.json) {
      console.log(`  ✓ ${path.relative(ctx.cwd, targetPath)}`);
    }
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

function warnOnCompatMismatch(
  item: { name: string; compat?: { remotion?: string } },
  installedRemotionVersion: string | undefined,
): void {
  const range = item.compat?.remotion;
  if (!range || !installedRemotionVersion) {
    return;
  }

  const coerced = semver.coerce(installedRemotionVersion);
  if (!coerced) {
    return;
  }

  if (!semver.satisfies(coerced, range)) {
    console.warn(
      `  ⚠ "${item.name}" expects remotion ${range}, but ${installedRemotionVersion} is installed.`,
    );
  }
}
