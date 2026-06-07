import fs from "fs-extra";
import path from "node:path";

export async function writeFile(
  filePath: string,
  content: string,
): Promise<void> {
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, "utf-8");
}

export function resolveProjectPath(cwd: string, alias: string): string {
  // TODO: Resolve alias from remotion-ui.json to filesystem path
  return path.join(cwd, alias.replace("@/", "src/"));
}
