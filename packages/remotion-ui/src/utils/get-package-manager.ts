import fs from "fs-extra";
import path from "node:path";

export type PackageManager = "pnpm" | "npm" | "yarn" | "bun";
export type InstallCommand = {
  command: string;
  args: string[];
};

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
): InstallCommand {
  const deps = packages.map(validateDependencySpec);

  switch (pm) {
    case "pnpm":
      return { command: "pnpm", args: ["add", ...deps] };
    case "yarn":
      return { command: "yarn", args: ["add", ...deps] };
    case "bun":
      return { command: "bun", args: ["add", ...deps] };
    default:
      return { command: "npm", args: ["install", ...deps] };
  }
}

function validateDependencySpec(spec: string): string {
  const trimmed = spec.trim();
  const safePackageSpec = /^(?:@[\w.-]+\/)?[\w.-]+(?:@[\w.~^*+-][\w.~^*+-]*)?$/;

  if (trimmed !== spec || !safePackageSpec.test(spec)) {
    throw new Error(`Invalid dependency spec: ${spec}`);
  }

  return spec;
}
