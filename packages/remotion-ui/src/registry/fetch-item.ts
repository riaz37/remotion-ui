import fs from "fs-extra";
import path from "node:path";
import { registryItemSchema } from "../schema/index.js";
import type { RegistryItemJson } from "./index.js";
import { RemotionUiError } from "../utils/errors.js";

export const DEFAULT_REGISTRY_URL = "https://remotionui.com/r";

export type FetchRegistryOptions = {
  registryUrl?: string;
  preset?: string;
};

/**
 * Registry items are also published to shadcn's directory, where a dependency
 * has to name its registry (`@remotionui/timing`) or shadcn resolves it against
 * its own. Our registry is flat, so the namespace is stripped on the way in —
 * from item names the user types as well as from registry dependencies.
 */
const REGISTRY_NAMESPACE_PREFIX = "@remotionui/";

export function stripRegistryNamespace(name: string): string {
  return name.startsWith(REGISTRY_NAMESPACE_PREFIX)
    ? name.slice(REGISTRY_NAMESPACE_PREFIX.length)
    : name;
}

export async function fetchRegistryItem(
  rawName: string,
  options: FetchRegistryOptions = {},
): Promise<RegistryItemJson> {
  const name = stripRegistryNamespace(rawName);
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
      throw new RemotionUiError(
        "REGISTRY_ITEM_NOT_FOUND",
        `Registry item "${name}" not found at ${filePath}`,
      );
    }

    const raw = await fs.readFile(filePath, "utf-8");
    return parseRegistryItem(JSON.parse(raw), name);
  }

  const url = `${registryUrl.replace(/\/$/, "")}/presets/${preset}/${name}.json`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new RemotionUiError(
      "REGISTRY_FETCH_FAILED",
      `Failed to fetch registry item "${name}" from ${url}`,
    );
  }

  return parseRegistryItem(await response.json(), name);
}

function parseRegistryItem(value: unknown, name: string): RegistryItemJson {
  const result = registryItemSchema.safeParse(value);
  if (!result.success) {
    throw new RemotionUiError(
      "REGISTRY_ITEM_INVALID",
      `Invalid registry item "${name}": ${result.error.issues
        .map((issue) => issue.path.join(".") || issue.message)
        .join(", ")}`,
    );
  }
  const item = result.data;
  if (!item.registryDependencies?.length) {
    return item;
  }

  return {
    ...item,
    registryDependencies: item.registryDependencies.map(stripRegistryNamespace),
  };
}

function isLocalRegistry(registryUrl: string): boolean {
  return (
    registryUrl.startsWith("/") ||
    registryUrl.startsWith("./") ||
    registryUrl.startsWith("../") ||
    registryUrl.startsWith("file:")
  );
}
