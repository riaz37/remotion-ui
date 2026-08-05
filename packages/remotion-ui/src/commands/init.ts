import { execSync } from "node:child_process";
import fs from "fs-extra";
import path from "node:path";
import { bootstrapExistingProject } from "../preflights/preflight-init.js";
import {
  detectPackageManager,
} from "../utils/get-package-manager.js";
import { getTemplateDir } from "../utils/get-template-dir.js";
import { installAgentSkill } from "../utils/install-agent-skill.js";
import { printStarPrompt } from "../utils/star-prompt.js";
import { RemotionUiError, toErrorJson } from "../utils/errors.js";

export type InitOptions = {
  cwd?: string;
  yes?: boolean;
  existing?: boolean;
  json?: boolean;
  agentSkill?: boolean;
};

export async function initCommand(
  projectName = "my-video",
  options: InitOptions = {},
): Promise<void> {
  const json = options.json ?? false;

  try {
    const cwd = path.resolve(options.cwd ?? process.cwd());
    const installSkill = options.agentSkill ?? Boolean(options.existing);

    if (options.existing) {
      const result = await bootstrapExistingProject(cwd, { json });

      if (installSkill) {
        await installAgentSkill(cwd);
      }

      if (!json) {
        printStarPrompt();
      } else {
        console.log(
          JSON.stringify({
            ok: true,
            existing: true,
            configPath: result.configPath,
            root: result.root,
          }),
        );
      }
      return;
    }

    const targetDir = path.join(cwd, projectName);
    const templateDir = getTemplateDir("remotion-app");

    if (!(await fs.pathExists(templateDir))) {
      throw new RemotionUiError(
        "TEMPLATE_NOT_FOUND",
        `Template not found: ${templateDir}`,
      );
    }

    if (await fs.pathExists(targetDir)) {
      throw new RemotionUiError(
        "TARGET_EXISTS",
        `Directory already exists: ${targetDir}`,
      );
    }

    if (!json) {
      console.log(`Creating Remotion project: ${projectName}`);
    }

    await fs.copy(templateDir, targetDir);

    const pkgPath = path.join(targetDir, "package.json");
    const pkg = (await fs.readJson(pkgPath)) as { name: string };
    pkg.name = projectName;
    await fs.writeJson(pkgPath, pkg, { spaces: 2 });

    const pm = await detectPackageManager(cwd);
    const installStdio = json ? "pipe" : "inherit";

    if (!json) {
      console.log("Installing dependencies...");
    }
    if (pm === "pnpm") {
      execSync("pnpm install", { cwd: targetDir, stdio: installStdio });
    } else if (pm === "yarn") {
      execSync("yarn install", { cwd: targetDir, stdio: installStdio });
    } else if (pm === "bun") {
      execSync("bun install", { cwd: targetDir, stdio: installStdio });
    } else {
      execSync("npm install", { cwd: targetDir, stdio: installStdio });
    }

    if (installSkill) {
      await installAgentSkill(targetDir);
    }

    if (json) {
      console.log(
        JSON.stringify({
          ok: true,
          existing: false,
          projectDir: targetDir,
          packageManager: pm,
        }),
      );
    } else {
      console.log(`\nProject created at ${targetDir}`);
      console.log(`\nNext steps:`);
      console.log(`  cd ${projectName}`);
      console.log(`  npm run dev`);
      console.log(`  npx remotion-ui add intro`);

      printStarPrompt();
    }
  } catch (error) {
    if (json) {
      console.log(JSON.stringify(toErrorJson(error)));
    }
    throw error;
  }
}
