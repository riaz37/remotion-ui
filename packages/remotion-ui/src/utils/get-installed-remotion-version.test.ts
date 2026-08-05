import fs from "fs-extra";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getInstalledRemotionVersion } from "./get-installed-remotion-version.js";

describe("getInstalledRemotionVersion", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "remotion-ui-installed-version-"),
    );
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  it("finds the version in dependencies", async () => {
    await fs.writeJson(path.join(tempDir, "package.json"), {
      name: "fixture",
      dependencies: { remotion: "^4.0.505" },
    });

    await expect(getInstalledRemotionVersion(tempDir)).resolves.toBe(
      "^4.0.505",
    );
  });

  it("finds the version in devDependencies", async () => {
    await fs.writeJson(path.join(tempDir, "package.json"), {
      name: "fixture",
      devDependencies: { remotion: "^4.0.0" },
    });

    await expect(getInstalledRemotionVersion(tempDir)).resolves.toBe(
      "^4.0.0",
    );
  });

  it("prefers dependencies over devDependencies when both are present", async () => {
    await fs.writeJson(path.join(tempDir, "package.json"), {
      name: "fixture",
      dependencies: { remotion: "^4.0.505" },
      devDependencies: { remotion: "^3.0.0" },
    });

    await expect(getInstalledRemotionVersion(tempDir)).resolves.toBe(
      "^4.0.505",
    );
  });

  it("returns undefined when remotion is not a dependency", async () => {
    await fs.writeJson(path.join(tempDir, "package.json"), {
      name: "fixture",
      dependencies: { react: "^19.0.0" },
    });

    await expect(getInstalledRemotionVersion(tempDir)).resolves.toBeUndefined();
  });

  it("returns undefined when there is no package.json", async () => {
    await expect(getInstalledRemotionVersion(tempDir)).resolves.toBeUndefined();
  });
});
