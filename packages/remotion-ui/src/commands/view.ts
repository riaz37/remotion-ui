import { fetchRegistryItem } from "../registry/fetch-item.js";

export type ViewOptions = {
  registryUrl?: string;
  preset?: string;
  json?: boolean;
};

export async function viewCommand(
  name: string,
  options: ViewOptions = {},
): Promise<void> {
  const item = await fetchRegistryItem(name, {
    registryUrl: options.registryUrl,
    preset: options.preset ?? "default",
  });

  if (options.json) {
    console.log(JSON.stringify(item, null, 2));
    return;
  }

  console.log(`Name: ${item.name}`);
  console.log(`Type: ${item.type}`);
  if (item.description) {
    console.log(`Description: ${item.description}`);
  }
  if (item.dependencies?.length) {
    console.log(`Dependencies: ${item.dependencies.join(", ")}`);
  }
  if (item.registryDependencies?.length) {
    console.log(
      `Registry dependencies: ${item.registryDependencies.join(", ")}`,
    );
  }
  if (item.composition) {
    console.log(`Composition: ${item.composition.id} (${item.composition.component})`);
  }
  console.log(`\nFiles:`);
  for (const file of item.files) {
    console.log(`  - ${file.path} (${file.type})`);
  }
}
