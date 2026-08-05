import fs from "fs-extra";
import path from "node:path";
import { RemotionUiError } from "./errors.js";
import { getTemplateDir } from "./get-template-dir.js";

/**
 * Installs the bundled RemotionUI Claude Code agent skill into a consumer's
 * repo at `<targetDir>/.claude/skills/remotionui-agent/SKILL.md`, teaching
 * their coding agent how to use RemotionUI correctly.
 */
export async function installAgentSkill(targetDir: string): Promise<void> {
  const templateDir = getTemplateDir("agent-skill");
  const sourcePath = path.join(templateDir, "SKILL.md");

  if (!(await fs.pathExists(sourcePath))) {
    throw new RemotionUiError(
      "TEMPLATE_NOT_FOUND",
      `Agent skill template not found: ${sourcePath}`,
    );
  }

  const destPath = path.join(
    targetDir,
    ".claude",
    "skills",
    "remotionui-agent",
    "SKILL.md",
  );

  await fs.ensureDir(path.dirname(destPath));
  await fs.copy(sourcePath, destPath);
}
