import { execSync } from "node:child_process";
import fs from "fs-extra";
import path from "node:path";
import {
  detectPackageManager,
  getInstallCommand,
} from "../utils/get-package-manager.js";
import { getTemplateDir } from "../utils/get-template-dir.js";

export type InitOptions = {
  cwd?: string;
  yes?: boolean;
};

export async function initCommand(
  projectName = "my-video",
  options: InitOptions = {},
): Promise<void> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const targetDir = path.join(cwd, projectName);
  const templateDir = getTemplateDir("remotion-app");

  if (!(await fs.pathExists(templateDir))) {
    throw new Error(`Template not found: ${templateDir}`);
  }

  if (await fs.pathExists(targetDir)) {
    throw new Error(`Directory already exists: ${targetDir}`);
  }

  console.log(`Creating Remotion project: ${projectName}`);

  await fs.copy(templateDir, targetDir);

  const pkgPath = path.join(targetDir, "package.json");
  const pkg = (await fs.readJson(pkgPath)) as { name: string };
  pkg.name = projectName;
  await fs.writeJson(pkgPath, pkg, { spaces: 2 });

  const pm = await detectPackageManager(cwd);

  console.log("Installing dependencies...");
  if (pm === "pnpm") {
    execSync("pnpm install", { cwd: targetDir, stdio: "inherit" });
  } else if (pm === "yarn") {
    execSync("yarn install", { cwd: targetDir, stdio: "inherit" });
  } else if (pm === "bun") {
    execSync("bun install", { cwd: targetDir, stdio: "inherit" });
  } else {
    execSync("npm install", { cwd: targetDir, stdio: "inherit" });
  }

  console.log(`\nProject created at ${targetDir}`);
  console.log(`\nNext steps:`);
  console.log(`  cd ${projectName}`);
  console.log(`  npm run dev`);
  console.log(`  npx remotion-ui add intro`);
}
