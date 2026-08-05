import fs from "fs-extra";
import path from "node:path";
import { fetchRegistryItem } from "../registry/fetch-item.js";
import { getConfig, resolveInstallPath } from "../utils/get-config.js";
import { toErrorJson } from "../utils/errors.js";

export type DiffOptions = {
  cwd?: string;
  registryUrl?: string;
  preset?: string;
  json?: boolean;
};

type DiffedFile = {
  path: string;
  status: "missing" | "changed";
};

function printUnifiedDiff(
  filePath: string,
  installed: string,
  registry: string,
): void {
  const installedLines = installed.split("\n");
  const registryLines = registry.split("\n");
  const max = Math.max(installedLines.length, registryLines.length);

  console.log(`--- ${filePath} (installed)`);
  console.log(`+++ ${filePath} (registry)`);

  for (let i = 0; i < max; i++) {
    const a = installedLines[i];
    const b = registryLines[i];

    if (a === b) {
      continue;
    }

    if (a !== undefined) {
      console.log(`-${a}`);
    }
    if (b !== undefined) {
      console.log(`+${b}`);
    }
  }
}

export async function diffCommand(
  name: string,
  options: DiffOptions = {},
): Promise<void> {
  const json = options.json ?? false;

  try {
    const cwd = path.resolve(options.cwd ?? process.cwd());
    const config = await getConfig(cwd);
    const preset = options.preset ?? config.preset;

    const item = await fetchRegistryItem(name, {
      registryUrl: options.registryUrl,
      preset,
    });

    const changed: DiffedFile[] = [];

    for (const file of item.files) {
      if (!file.content) {
        if (!json) {
          console.warn(`  ⚠ No registry content for ${file.path}`);
        }
        continue;
      }

      const targetPath = resolveInstallPath(cwd, config, file);
      const relativePath = path.relative(cwd, targetPath);

      if (!(await fs.pathExists(targetPath))) {
        if (!json) {
          console.log(`\n${relativePath}: not installed`);
        }
        changed.push({ path: relativePath, status: "missing" });
        continue;
      }

      const installed = await fs.readFile(targetPath, "utf-8");

      if (installed.trim() !== file.content.trim()) {
        if (!json) {
          console.log(`\nDiff for ${relativePath}:`);
          printUnifiedDiff(relativePath, installed, file.content);
        }
        changed.push({ path: relativePath, status: "changed" });
      }
    }

    if (json) {
      console.log(
        JSON.stringify({
          ok: true,
          name,
          changed,
        }),
      );
    } else if (changed.length === 0) {
      console.log(`${name}: no differences (installed matches registry)`);
    }
  } catch (error) {
    if (json) {
      console.log(JSON.stringify(toErrorJson(error)));
    }
    throw error;
  }
}
