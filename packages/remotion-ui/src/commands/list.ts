import fs from "fs-extra";
import path from "node:path";
import { getConfig, resolveAliasPath } from "../utils/get-config.js";
import { fetchRegistryIndex } from "../registry/fetch-index.js";

export type ListOptions = {
  cwd?: string;
  registryUrl?: string;
  json?: boolean;
};

type ListedComponent = {
  name: string;
  installed: boolean;
  installPath?: string;
};

export async function listCommand(
  options: ListOptions = {},
): Promise<void> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const index = await fetchRegistryIndex(options.registryUrl);
  const installed = new Set<string>();

  try {
    const config = await getConfig(cwd);
    for (const alias of Object.values(config.aliases)) {
      const baseDir = resolveAliasPath(cwd, alias);
      if (!(await fs.pathExists(baseDir))) continue;
      const entries = await fs.readdir(baseDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          installed.add(entry.name);
        } else if (entry.isFile() && /\.(t|j)sx?$/.test(entry.name)) {
          installed.add(entry.name.replace(/\.(t|j)sx?$/, ""));
        }
      }
    }
  } catch {
    // No config — report registry only with installed=false
  }

  const rows: ListedComponent[] = index.items.map((item) => {
    const isInstalled = installed.has(item.name);
    return {
      name: item.name,
      installed: isInstalled,
      ...(isInstalled ? { installPath: guessInstallPath(item.name) } : {}),
    };
  });

  const installedCount = rows.filter((row) => row.installed).length;

  if (options.json) {
    console.log(
      JSON.stringify(
        {
          total: rows.length,
          installed: installedCount,
          components: rows,
        },
        null,
        2,
      ),
    );
    return;
  }

  for (const row of rows) {
    const marker = row.installed ? "✓" : " ";
    console.log(`${marker} ${row.name}`);
  }
  console.log(`\n${installedCount}/${rows.length} installed`);
}

function guessInstallPath(name: string): string | undefined {
  return name;
}
