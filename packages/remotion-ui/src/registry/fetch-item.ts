import fs from "fs-extra";
import path from "node:path";
import { registryItemSchema } from "../schema/index.js";
import type { RegistryItemJson } from "./index.js";

export const DEFAULT_REGISTRY_URL = "https://remotionui.vercel.app/r";

export type FetchRegistryOptions = {
  registryUrl?: string;
  preset?: string;
};

export async function fetchRegistryItem(
  name: string,
  options: FetchRegistryOptions = {},
): Promise<RegistryItemJson> {
  const registryUrl =
    options.registryUrl ??
    process.env.REMOTION_UI_REGISTRY_URL ??
    DEFAULT_REGISTRY_URL;
  const preset = options.preset ?? "default";

  if (isLocalRegistry(registryUrl)) {
    const filePath = path.join(
      path.resolve(registryUrl),
      "presets",
      preset,
      `${name}.json`,
    );

    if (!(await fs.pathExists(filePath))) {
      throw new Error(`Registry item "${name}" not found at ${filePath}`);
    }

    const raw = await fs.readFile(filePath, "utf-8");
    return parseRegistryItem(JSON.parse(raw), name);
  }

  const url = `${registryUrl.replace(/\/$/, "")}/presets/${preset}/${name}.json`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch registry item "${name}" from ${url}`);
  }

  return parseRegistryItem(await response.json(), name);
}

function parseRegistryItem(value: unknown, name: string): RegistryItemJson {
  const result = registryItemSchema.safeParse(value);
  if (!result.success) {
    throw new Error(
      `Invalid registry item "${name}": ${result.error.issues
        .map((issue) => issue.path.join(".") || issue.message)
        .join(", ")}`,
    );
  }
  return result.data;
}

function isLocalRegistry(registryUrl: string): boolean {
  return (
    registryUrl.startsWith("/") ||
    registryUrl.startsWith("./") ||
    registryUrl.startsWith("../") ||
    registryUrl.startsWith("file:")
  );
}
