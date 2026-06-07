import fs from "fs-extra";
import path from "node:path";

export type PackageManager = "pnpm" | "npm" | "yarn" | "bun";

export async function detectPackageManager(
  cwd: string,
): Promise<PackageManager> {
  const pkgPath = path.join(cwd, "package.json");

  if (await fs.pathExists(pkgPath)) {
    const pkg = (await fs.readJson(pkgPath)) as {
      packageManager?: string;
    };

    if (pkg.packageManager?.startsWith("pnpm")) return "pnpm";
    if (pkg.packageManager?.startsWith("yarn")) return "yarn";
    if (pkg.packageManager?.startsWith("bun")) return "bun";
  }

  if (await fs.pathExists(path.join(cwd, "pnpm-lock.yaml"))) return "pnpm";
  if (await fs.pathExists(path.join(cwd, "yarn.lock"))) return "yarn";
  if (await fs.pathExists(path.join(cwd, "bun.lockb"))) return "bun";

  return "npm";
}

export function getInstallCommand(
  pm: PackageManager,
  packages: string[],
): string {
  const deps = packages.join(" ");

  switch (pm) {
    case "pnpm":
      return `pnpm add ${deps}`;
    case "yarn":
      return `yarn add ${deps}`;
    case "bun":
      return `bun add ${deps}`;
    default:
      return `npm install ${deps}`;
  }
}
