import { execSync } from "node:child_process";
import fs from "fs-extra";
import path from "node:path";
import { addCommand } from "./add.js";
import { bootstrapExistingProject } from "../preflights/preflight-init.js";
import {
  detectPackageManager,
} from "../utils/get-package-manager.js";
import { getTemplateDir } from "../utils/get-template-dir.js";
import { printStarPrompt } from "../utils/star-prompt.js";

export type InitStarter = "default" | "social" | "podcast";

export type InitOptions = {
  cwd?: string;
  yes?: boolean;
  existing?: boolean;
  starter?: InitStarter;
};

const STARTER_RECIPES: Partial<Record<InitStarter, string>> = {
  social: "captioned-social-video",
  podcast: "podcast-clip",
};

const STARTER_RENDER_COMMANDS: Partial<Record<InitStarter, string>> = {
  social: "npx remotion render src/Root.tsx SocialClip out/social-clip.mp4",
  podcast: "npx remotion render src/Root.tsx PodcastClip out/podcast-clip.mp4",
};

export async function initCommand(
  projectName = "my-video",
  options: InitOptions = {},
): Promise<void> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const starter = options.starter ?? "default";

  if (options.existing) {
    await bootstrapExistingProject(cwd);
    printStarPrompt();
    return;
  }

  const targetDir = path.join(cwd, projectName);
  const templateDir = getTemplateDir("remotion-app");

  if (!(await fs.pathExists(templateDir))) {
    throw new Error(`Template not found: ${templateDir}`);
  }

  if (await fs.pathExists(targetDir)) {
    throw new Error(`Directory already exists: ${targetDir}`);
  }

  console.log(`Creating Remotion project: ${projectName}`);
  if (starter !== "default") {
    console.log(`Starter: ${starter}`);
  }

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

  const recipeSlug = STARTER_RECIPES[starter];
  if (recipeSlug) {
    console.log(`\nInstalling starter recipe: ${recipeSlug}`);
    await addCommand([], {
      cwd: targetDir,
      recipe: recipeSlug,
      yes: options.yes ?? true,
      showStarPrompt: false,
    });
  }

  console.log(`\nProject created at ${targetDir}`);
  console.log(`\nNext steps:`);
  console.log(`  cd ${projectName}`);
  console.log(`  npm run dev`);
  const renderCommand = STARTER_RENDER_COMMANDS[starter];
  if (renderCommand) {
    console.log(`  ${renderCommand}`);
  } else {
    console.log(`  npx remotion-ui add intro`);
  }

  printStarPrompt();
}
