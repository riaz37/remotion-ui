import { execFileSync } from "node:child_process";
import fs from "fs-extra";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { addCommand } from "./add.js";

vi.mock("node:child_process", () => ({
  execFileSync: vi.fn(),
}));

const fixtureDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../test/fixtures/remotion-app",
);
const registryDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../test/fixtures/registry",
);

describe("addCommand", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "remotion-ui-add-"));
    await fs.copy(fixtureDir, tempDir, {
      filter: (src) => !src.includes("node_modules"),
    });
    vi.mocked(execFileSync).mockReset();
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  it("writes primitive files to the correct path", async () => {
    await addCommand(["fade-in"], {
      cwd: tempDir,
      registryUrl: registryDir,
    });

    const target = path.join(tempDir, "src/remotion/primitives/fade-in.tsx");
    expect(await fs.pathExists(target)).toBe(true);
    const content = await fs.readFile(target, "utf-8");
    expect(content).toContain("FadeIn");
  });

  it("installs registry dependencies in order", async () => {
    await addCommand(["lower-third"], {
      cwd: tempDir,
      registryUrl: registryDir,
    });

    expect(
      await fs.pathExists(
        path.join(tempDir, "src/remotion/primitives/fade-in.tsx"),
      ),
    ).toBe(true);
    expect(
      await fs.pathExists(
        path.join(tempDir, "src/remotion/primitives/slide-left.tsx"),
      ),
    ).toBe(true);
    expect(
      await fs.pathExists(
        path.join(tempDir, "src/remotion/scenes/lower-third/index.tsx"),
      ),
    ).toBe(true);
  });

  it("rejects registry dependency specs with shell metacharacters", async () => {
    const maliciousRegistry = path.join(tempDir, "malicious-registry");
    await fs.ensureDir(path.join(maliciousRegistry, "presets", "default"));
    await fs.writeJson(
      path.join(maliciousRegistry, "presets", "default", "bad.json"),
      {
        name: "bad",
        type: "registry:ui",
        dependencies: ["remotion; touch pwned"],
        files: [
          {
            path: "registry/bases/default/primitives/bad.tsx",
            type: "registry:ui",
            content: "export const Bad = () => null;\n",
          },
        ],
      },
    );

    await expect(
      addCommand(["bad"], {
        cwd: tempDir,
        registryUrl: maliciousRegistry,
      }),
    ).rejects.toThrow("Invalid dependency spec");
    expect(execFileSync).not.toHaveBeenCalled();
  });

  it("patches Root.tsx when adding a composition", async () => {
    await addCommand(["intro"], {
      cwd: tempDir,
      registryUrl: registryDir,
    });

    const root = await fs.readFile(path.join(tempDir, "src/Root.tsx"), "utf-8");
    expect(root).toContain('id="Intro"');
    expect(
      await fs.pathExists(
        path.join(tempDir, "src/compositions/intro/index.tsx"),
      ),
    ).toBe(true);
  });
});
