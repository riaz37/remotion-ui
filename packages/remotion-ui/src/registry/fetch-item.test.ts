import fs from "fs-extra";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_REGISTRY_URL, fetchRegistryItem } from "./fetch-item.js";

describe("fetchRegistryItem", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "remotion-ui-fetch-"));
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  it("defaults to the hosted registry URL", () => {
    expect(DEFAULT_REGISTRY_URL).toBe("https://remotionui.vercel.app/r");
  });

  it("rejects local registry items that do not match the runtime schema", async () => {
    const registryDir = path.join(tempDir, "registry");
    await fs.ensureDir(path.join(registryDir, "presets", "default"));
    await fs.writeJson(
      path.join(registryDir, "presets", "default", "broken.json"),
      {
        name: "broken",
        type: "registry:ui",
      },
    );

    await expect(
      fetchRegistryItem("broken", { registryUrl: registryDir }),
    ).rejects.toThrow("Invalid registry item");
  });
});
