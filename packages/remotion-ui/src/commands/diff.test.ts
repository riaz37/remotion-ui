import fs from "fs-extra";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { diffCommand } from "./diff.js";

describe("diffCommand", () => {
  let tempDir: string;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  const fixtureDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../test/fixtures/remotion-app",
  );
  const registryDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../test/fixtures/registry",
  );

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "remotion-ui-diff-"));
    await fs.copy(fixtureDir, tempDir, {
      filter: (src) => !src.includes("node_modules"),
    });
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(async () => {
    await fs.remove(tempDir);
    vi.restoreAllMocks();
  });

  it("reports no differences when files match", async () => {
    await fs.writeFile(
      path.join(tempDir, "src/remotion/primitives/fade-in.tsx"),
      "export const FadeIn = () => null;\n",
      "utf-8",
    );

    await diffCommand("fade-in", {
      cwd: tempDir,
      registryUrl: registryDir,
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      "fade-in: no differences (installed matches registry)",
    );
  });

  it("reports diff when installed file differs", async () => {
    await fs.writeFile(
      path.join(tempDir, "src/remotion/primitives/fade-in.tsx"),
      "export const Old = () => null;\n",
      "utf-8",
    );

    await diffCommand("fade-in", {
      cwd: tempDir,
      registryUrl: registryDir,
    });

    const output = consoleSpy.mock.calls.flat().join("\n");
    expect(output).toContain("Diff for");
    expect(output).toContain("-export const Old");
    expect(output).toContain("+export const FadeIn");
  });

  it("non-json error text is unchanged for a missing component", async () => {
    await expect(
      diffCommand("does-not-exist", {
        cwd: tempDir,
        registryUrl: registryDir,
      }),
    ).rejects.toThrow(/Registry item "does-not-exist" not found at/);
  });

  it("--json + a missing component produces a valid {ok:false} JSON blob on stdout", async () => {
    await expect(
      diffCommand("does-not-exist", {
        cwd: tempDir,
        registryUrl: registryDir,
        json: true,
      }),
    ).rejects.toThrow(/Registry item "does-not-exist" not found at/);

    const stdout = consoleSpy.mock.calls.map((call) => call.join(" ")).join("\n");
    const parsed = JSON.parse(stdout);
    expect(parsed.ok).toBe(false);
    expect(parsed.error.code).toBe("REGISTRY_ITEM_NOT_FOUND");
  });

  it("--json + a diff produces a single valid JSON object on stdout", async () => {
    await fs.writeFile(
      path.join(tempDir, "src/remotion/primitives/fade-in.tsx"),
      "export const Old = () => null;\n",
      "utf-8",
    );

    await diffCommand("fade-in", {
      cwd: tempDir,
      registryUrl: registryDir,
      json: true,
    });

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    const stdout = consoleSpy.mock.calls[0]?.join(" ") ?? "";
    const parsed = JSON.parse(stdout);
    expect(parsed.ok).toBe(true);
    expect(parsed.name).toBe("fade-in");
    expect(parsed.changed).toEqual([
      { path: "src/remotion/primitives/fade-in.tsx", status: "changed" },
    ]);
  });
});
