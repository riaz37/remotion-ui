import { addCommand, type AddOptions } from "./add.js";
import { RemotionUiError, toErrorJson } from "../utils/errors.js";

export type UpdateOptions = AddOptions;

/** Re-install a component from the registry, overwriting local files */
export async function updateCommand(
  components: string[],
  options: UpdateOptions = {},
): Promise<void> {
  const json = options.json ?? false;

  if (components.length === 0) {
    const error = new RemotionUiError(
      "INVALID_ARGS",
      "Please specify at least one component to update.",
    );
    if (json) {
      console.log(JSON.stringify(toErrorJson(error)));
    }
    throw error;
  }

  if (!json) {
    console.log(`Updating ${components.length} component(s) from registry…`);
  }

  // addCommand owns json success/error output for its own execution — do not
  // wrap this call in another try/catch or it would double-print the JSON
  // error blob when addCommand fails.
  await addCommand(components, { ...options, showStarPrompt: false });
}
