import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");
const registryJsonPath = path.join(appRoot, "registry.json");

type RegistryItem = {
  name: string;
  type: string;
  files: Array<{ path: string; type: string }>;
};

type Registry = {
  items: RegistryItem[];
};

async function validateRegistries(): Promise<void> {
  console.log("Validating registry...");

  const registryRaw = await fs.readFile(registryJsonPath, "utf-8");
  const registry: Registry = JSON.parse(registryRaw);

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
