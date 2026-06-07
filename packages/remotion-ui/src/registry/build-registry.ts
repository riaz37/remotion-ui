import fs from "fs-extra";
import path from "node:path";

type RegistryFile = {
  path: string;
  type: string;
  target?: string;
  content?: string;
};

type AtlasMeta = {
  lane: string;
  drive: string;
  tier: string;
  tags?: string[];
};

type RegistryItem = {
  name: string;
  type: string;
  description?: string;
  dependencies?: string[];
  registryDependencies?: string[];
  atlas?: AtlasMeta;
  composition?: Record<string, unknown>;
  files: RegistryFile[];
};

type Registry = {
  name: string;
  homepage?: string;
  items: RegistryItem[];
};

export type BuildRegistryOptions = {
  registryPath: string;
  outputDir: string;
  preset?: string;
};

async function readFileContent(
  appRoot: string,
  relativePath: string,
): Promise<string | null> {
  const absolutePath = path.join(appRoot, relativePath);
  try {
    return await fs.readFile(absolutePath, "utf-8");
  } catch {
    return null;
  }
}

export async function buildRegistry(
  options: BuildRegistryOptions,
): Promise<{ itemCount: number; outputDir: string }> {
  const registryPath = path.resolve(options.registryPath);
  const appRoot = path.dirname(registryPath);
  const preset = options.preset ?? "default";
  const baseOutputDir = path.resolve(options.outputDir);
  const outputDir = path.resolve(baseOutputDir, "presets", preset);

  const registryRaw = await fs.readFile(registryPath, "utf-8");
  const registry: Registry = JSON.parse(registryRaw);

  await fs.mkdir(outputDir, { recursive: true });

  const index: Array<{
    name: string;
    type: string;
    description?: string;
    atlas?: AtlasMeta;
  }> = [];

  for (const item of registry.items) {
    const filesWithContent = [];

    for (const file of item.files) {
      const content = await readFileContent(appRoot, file.path);
      filesWithContent.push({
        ...file,
        ...(content !== null ? { content } : {}),
      });
    }

    const output = {
      ...item,
      files: filesWithContent,
    };

    await fs.writeFile(
      path.join(outputDir, `${item.name}.json`),
      JSON.stringify(output, null, 2),
      "utf-8",
    );

    index.push({
      name: item.name,
      type: item.type,
      description: item.description,
      ...(item.atlas ? { atlas: item.atlas } : {}),
    });
  }

  await fs.mkdir(baseOutputDir, { recursive: true });
  await fs.writeFile(
    path.join(baseOutputDir, "index.json"),
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

  return { itemCount: registry.items.length, outputDir };
}
