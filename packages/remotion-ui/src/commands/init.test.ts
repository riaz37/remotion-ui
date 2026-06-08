import { execSync } from "node:child_process";
import fs from "fs-extra";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initCommand } from "./init.js";

vi.mock("node:child_process", () => ({
  execSync: vi.fn(),
}));

describe("initCommand", () => {
  let tempDir: string;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "remotion-ui-init-"));
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.mocked(execSync).mockReset();
  });

  afterEach(async () => {
    await fs.remove(tempDir);
    vi.restoreAllMocks();
  });

  it("creates a starter composition so Remotion Studio is not empty", async () => {
    await initCommand("my-video", { cwd: tempDir });

    const root = await fs.readFile(
      path.join(tempDir, "my-video", "src/Root.tsx"),
      "utf-8",
    );
    const composition = await fs.readFile(
      path.join(tempDir, "my-video", "src/compositions/welcome/index.tsx"),
      "utf-8",
    );

    expect(root).toContain('id="Welcome"');
    expect(root).toContain("WelcomeComposition");
    expect(composition).toContain("Your first composition is ready.");
    expect(consoleSpy.mock.calls.flat().join("\n")).toContain(
      "npx remotion-ui add intro",
    );
  });
});
