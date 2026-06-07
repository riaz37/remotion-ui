import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");
const registryJsonPath = path.join(appRoot, "registry.json");
const outputDir = path.join(appRoot, "public", "r", "presets", "default");

type RegistryFile = {
  path: string;
  type: string;
  target?: string;
};

type RegistryItem = {
  name: string;
  type: string;
  description?: string;
  dependencies?: string[];
  registryDependencies?: string[];
  files: RegistryFile[];
};

type Registry = {
  name: string;
  homepage?: string;
  items: RegistryItem[];
};

async function readFileContent(relativePath: string): Promise<string | null> {
  const absolutePath = path.join(appRoot, relativePath);
  try {
    return await fs.readFile(absolutePath, "utf-8");
  } catch {
    console.warn(`  ⚠ Source file not found: ${relativePath}`);
    return null;
  }
}

async function buildRegistry(): Promise<void> {
  console.log("Building registry...");

  const registryRaw = await fs.readFile(registryJsonPath, "utf-8");
  const registry: Registry = JSON.parse(registryRaw);

  await fs.mkdir(outputDir, { recursive: true });

  const index: Array<{ name: string; type: string; description?: string }> = [];

  for (const item of registry.items) {
    const filesWithContent = [];

    for (const file of item.files) {
      const content = await readFileContent(file.path);
      filesWithContent.push({
        ...file,
        ...(content !== null ? { content } : {}),
      });
    }

    const output = {
      ...item,
      files: filesWithContent,
    };

    const outputPath = path.join(outputDir, `${item.name}.json`);
    await fs.writeFile(outputPath, JSON.stringify(output, null, 2), "utf-8");
    console.log(`  ✓ ${item.name}.json`);

    index.push({
      name: item.name,
      type: item.type,
      description: item.description,
    });
  }

  const indexPath = path.join(appRoot, "public", "r", "index.json");
  await fs.mkdir(path.dirname(indexPath), { recursive: true });
  await fs.writeFile(
    indexPath,
    JSON.stringify(
      {
        name: registry.name,
        homepage: registry.homepage,
        items: index,
      },
      null,
      2,
    ),
    "utf-8",
  );

  console.log(`\nRegistry built: ${registry.items.length} item(s)`);
  console.log(`Output: public/r/`);
}

buildRegistry().catch((error) => {
  console.error("Registry build failed:", error);
  process.exit(1);
});
