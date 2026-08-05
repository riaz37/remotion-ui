import fs from "fs-extra";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildCommand } from "./build.js";

describe("buildCommand", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "remotion-ui-build-cmd-"));
    await fs.writeJson(path.join(tempDir, "registry.json"), {
      name: "test",
      items: [
        {
          name: "timing",
          type: "registry:lib",
          files: [{ path: "lib/timing.ts", type: "registry:lib" }],
        },
      ],
    });
    await fs.ensureDir(path.join(tempDir, "lib"));
    await fs.writeFile(
      path.join(tempDir, "lib/timing.ts"),
      "export const x = 1;\n",
      "utf-8",
    );
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  it("writes preset JSON and index via CLI", async () => {
    const outputDir = path.join(tempDir, "out", "r");
    await buildCommand("registry.json", {
      cwd: tempDir,
      outputDir,
      preset: "default",
    });

    const item = await fs.readJson(
      path.join(outputDir, "presets", "default", "timing.json"),
    );
    expect(item.files[0].content).toContain("export const x");

    const index = await fs.readJson(path.join(outputDir, "index.json"));
    expect(index.items).toHaveLength(1);
  });

  it("non-json error text is unchanged for a missing registry.json", async () => {
    await expect(
      buildCommand("does-not-exist.json", { cwd: tempDir }),
    ).rejects.toThrow();
  });

  it("--json + a missing registry.json produces a valid {ok:false} JSON blob on stdout", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await expect(
      buildCommand("does-not-exist.json", { cwd: tempDir, json: true }),
    ).rejects.toThrow();

    const stdout = logSpy.mock.calls.map((call) => call.join(" ")).join("\n");
    const parsed = JSON.parse(stdout);
    expect(parsed.ok).toBe(false);
    expect(parsed.error.code).toBe("UNKNOWN");

    logSpy.mockRestore();
  });

  it("--json + a successful build produces a single valid JSON object on stdout", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const outputDir = path.join(tempDir, "out", "r");

    await buildCommand("registry.json", {
      cwd: tempDir,
      outputDir,
      preset: "default",
      json: true,
    });

    expect(logSpy).toHaveBeenCalledTimes(1);
    const stdout = logSpy.mock.calls[0]?.join(" ") ?? "";
    const parsed = JSON.parse(stdout);
    expect(parsed.ok).toBe(true);
    expect(parsed.itemCount).toBe(1);
    expect(parsed.filesWritten).toEqual(["timing"]);

    logSpy.mockRestore();
  });
});
