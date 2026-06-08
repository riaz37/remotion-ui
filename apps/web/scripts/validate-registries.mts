import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");
const registryJsonPath = path.join(appRoot, "registry.json");

type RegistryItem = {
  name: string;
  type: string;
  registryDependencies?: string[];
  files: Array<{ path: string; type: string }>;
};

type Registry = {
  items: RegistryItem[];
};

function specToRegistryPath(spec: string): string | null {
  if (spec.startsWith("@/remotion/primitives/")) {
    return `registry/bases/default/primitives/${spec.slice("@/remotion/primitives/".length)}.tsx`;
  }

  if (spec.startsWith("@/remotion/scenes/")) {
    return `registry/bases/default/scenes/${spec.slice("@/remotion/scenes/".length)}/index.tsx`;
  }

  if (spec.startsWith("@/remotion/lib/")) {
    return `registry/bases/default/lib/${spec.slice("@/remotion/lib/".length)}.ts`;
  }

  if (spec.startsWith("@/remotion/hooks/")) {
    return `registry/bases/default/hooks/${spec.slice("@/remotion/hooks/".length)}.ts`;
  }

  if (spec.startsWith("@/compositions/")) {
    return `registry/bases/default/compositions/${spec.slice("@/compositions/".length)}.tsx`;
  }

  return null;
}

async function findMissingInternalDependencies(
  item: RegistryItem,
  filePathToItem: Map<string, string>,
): Promise<string[]> {
  const missing = new Set<string>();

  for (const file of item.files) {
    const absolutePath = path.join(appRoot, file.path);

    try {
      const source = await fs.readFile(absolutePath, "utf-8");
      for (const match of source.matchAll(/from\s+["']([^"']+)["']/g)) {
        const dependencyPath = specToRegistryPath(match[1]);
        if (!dependencyPath) {
          continue;
        }

        const dependencyName = filePathToItem.get(dependencyPath);
        if (
          dependencyName &&
          dependencyName !== item.name &&
          !item.registryDependencies?.includes(dependencyName)
        ) {
          missing.add(dependencyName);
        }
      }
    } catch {
      // Missing source files are handled by the main validator loop.
    }
  }

  return [...missing].sort();
}

async function validateRegistries(): Promise<void> {
  console.log("Validating registry...");

  const registryRaw = await fs.readFile(registryJsonPath, "utf-8");
  const registry: Registry = JSON.parse(registryRaw);
  const filePathToItem = new Map<string, string>();

  for (const item of registry.items) {
    for (const file of item.files ?? []) {
      filePathToItem.set(file.path, item.name);
    }
  }

  let errors = 0;

  for (const item of registry.items) {
    if (!item.name) {
      console.error(`  ✗ Item missing name`);
      errors++;
      continue;
    }

    if (!item.files || item.files.length === 0) {
      console.error(`  ✗ ${item.name}: no files defined`);
      errors++;
      continue;
    }

    for (const file of item.files) {
      const absolutePath = path.join(appRoot, file.path);
      try {
        await fs.access(absolutePath);
        console.log(`  ✓ ${item.name} → ${file.path}`);
      } catch {
        console.warn(`  ⚠ ${item.name} → ${file.path} (not found yet)`);
      }
    }

    const missingDependencies = await findMissingInternalDependencies(
      item,
      filePathToItem,
    );
    if (missingDependencies.length > 0) {
      console.error(
        `  ✗ ${item.name}: missing registryDependencies ${missingDependencies.join(", ")}`,
      );
      errors++;
    }
  }

  if (errors > 0) {
    console.error(`\nValidation failed with ${errors} error(s)`);
    process.exit(1);
  }

  console.log(`\nValidation complete: ${registry.items.length} item(s)`);
}

validateRegistries().catch((error) => {
  console.error("Validation failed:", error);
  process.exit(1);
});
