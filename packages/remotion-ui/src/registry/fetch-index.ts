import fs from "fs-extra";
import path from "node:path";
import { DEFAULT_REGISTRY_URL } from "./fetch-item.js";

export type RegistryIndexAtlas = {
  lane: string;
  drive: string;
  tier: string;
  tags?: string[];
};

export type RegistryIndexItem = {
  name: string;
  type: string;
  description?: string;
  atlas?: RegistryIndexAtlas;
};

export type RegistryIndex = {
  name: string;
  homepage?: string;
  items: RegistryIndexItem[];
};

export async function fetchRegistryIndex(
  registryUrl = process.env.REMOTION_UI_REGISTRY_URL ?? DEFAULT_REGISTRY_URL,
): Promise<RegistryIndex> {
  if (isLocalRegistry(registryUrl)) {
    const filePath = path.join(path.resolve(registryUrl), "index.json");
    if (!(await fs.pathExists(filePath))) {
      throw new Error(`Registry index not found at ${filePath}`);
    }
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as RegistryIndex;
  }

  const url = `${registryUrl.replace(/\/$/, "")}/index.json`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch registry index from ${url}`);
  }

  return response.json() as Promise<RegistryIndex>;
}

function isLocalRegistry(registryUrl: string): boolean {
  return (
    registryUrl.startsWith("/") ||
    registryUrl.startsWith("./") ||
    registryUrl.startsWith("../") ||
    registryUrl.startsWith("file:")
  );
}
