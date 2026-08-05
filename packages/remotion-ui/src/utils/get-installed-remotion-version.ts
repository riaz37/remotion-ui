import fs from "fs-extra";
import path from "node:path";

type PackageJsonDependencies = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

/**
 * Reads the `remotion` version string from a project's package.json, checking
 * `dependencies` before `devDependencies`. Returns `undefined` if there is no
 * package.json at `cwd`, or if `remotion` is not listed in either.
 */
export async function getInstalledRemotionVersion(
  cwd: string,
): Promise<string | undefined> {
  const pkgPath = path.join(cwd, "package.json");

  if (!(await fs.pathExists(pkgPath))) {
    return undefined;
  }

  const pkg = (await fs.readJson(pkgPath)) as PackageJsonDependencies;

  return pkg.dependencies?.remotion ?? pkg.devDependencies?.remotion;
}
