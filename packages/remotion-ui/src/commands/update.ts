import { addCommand, type AddOptions } from "./add.js";

export type UpdateOptions = AddOptions;

/** Re-install a component from the registry, overwriting local files */
export async function updateCommand(
  components: string[],
  options: UpdateOptions = {},
): Promise<void> {
  if (components.length === 0) {
    throw new Error("Please specify at least one component to update.");
  }

  console.log(`Updating ${components.length} component(s) from registry…`);
  await addCommand(components, { ...options, showStarPrompt: false });
}
