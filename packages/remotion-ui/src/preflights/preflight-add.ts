import fs from "fs-extra";
import path from "node:path";
import { getConfig } from "../utils/get-config.js";
import { RemotionUiError } from "../utils/errors.js";
import { getInstalledRemotionVersion } from "../utils/get-installed-remotion-version.js";

export async function preflightAdd(cwd: string): Promise<void> {
  const configPath = path.join(cwd, "remotion-ui.json");

  if (!(await fs.pathExists(configPath))) {
    throw new RemotionUiError(
      "CONFIG_NOT_FOUND",
      `No remotion-ui.json found in ${cwd}. Run "remotion-ui init" first.`,
    );
  }

  const config = await getConfig(cwd);
  const pkgPath = path.join(cwd, "package.json");

  if (!(await fs.pathExists(pkgPath))) {
    console.warn("  ⚠ No package.json found. npm dependencies won't be installed.");
    return;
  }

  const remotionVersion = await getInstalledRemotionVersion(cwd);

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
