import fs from "fs-extra";
import path from "node:path";
import { getConfig } from "../utils/get-config.js";

export async function preflightAdd(cwd: string): Promise<void> {
  const configPath = path.join(cwd, "remotion-ui.json");

  if (!(await fs.pathExists(configPath))) {
    throw new Error(
      `No remotion-ui.json found in ${cwd}. Run "remotion-ui init" first.`,
    );
  }

  const config = await getConfig(cwd);
  const pkgPath = path.join(cwd, "package.json");

  if (!(await fs.pathExists(pkgPath))) {
    console.warn("  ⚠ No package.json found. npm dependencies won't be installed.");
    return;
  }

  const pkg = (await fs.readJson(pkgPath)) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };

  const remotionVersion =
    pkg.dependencies?.remotion ?? pkg.devDependencies?.remotion;

  if (!remotionVersion) {
    console.warn("  ⚠ remotion is not in package.json dependencies.");
    return;
  }

  const expectedMajor = config.remotion.version;
  const installedMajor = remotionVersion.replace(/[^0-9].*$/, "");

  if (expectedMajor && installedMajor && expectedMajor !== installedMajor) {
    console.warn(
      `  ⚠ Remotion major version mismatch: remotion-ui.json expects v${expectedMajor}, package.json has ${remotionVersion}`,
    );
  }
}
