import fs from "fs-extra";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { addCommand } from "./add.js";
import { updateCommand } from "./update.js";
import { hashContent, LOCKFILE_NAME } from "../utils/lockfile.js";

vi.mock("node:child_process", () => ({
  execFileSync: vi.fn(),
}));

const fixtureDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../test/fixtures/remotion-app",
);
const registryFixtureDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../test/fixtures/registry",
);

const SLIDE_LEFT = "src/remotion/primitives/slide-left.tsx";
const NEW_UPSTREAM = "export const SlideLeft = () => 'v2';\n";

describe("updateCommand", () => {
  let tempDir: string;
  let registryDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "remotion-ui-update-"));
    await fs.copy(fixtureDir, path.join(tempDir, "app"), {
      filter: (src) => !src.includes("node_modules"),
    });
    registryDir = path.join(tempDir, "registry");
    await fs.copy(registryFixtureDir, registryDir);
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await fs.remove(tempDir);
  });

  const appDir = () => path.join(tempDir, "app");
  const target = () => path.join(appDir(), SLIDE_LEFT);

  async function publishUpstream(content: string): Promise<void> {
    const itemPath = path.join(
      registryDir,
      "presets/default/slide-left.json",
    );
    const item = await fs.readJson(itemPath);
    item.files[0].content = content;
    await fs.writeJson(itemPath, item);
  }

  it("add records the installed file's hash in the lockfile", async () => {
    await addCommand(["slide-left"], { cwd: appDir(), registryUrl: registryDir });

    const lock = await fs.readJson(path.join(appDir(), LOCKFILE_NAME));
    expect(lock.files[SLIDE_LEFT]).toEqual({
      component: "slide-left",
      sha256: hashContent(await fs.readFile(target(), "utf-8")),
    });
  });

  it("replaces an unedited file when the registry has changed", async () => {
    await addCommand(["slide-left"], { cwd: appDir(), registryUrl: registryDir });
    await publishUpstream(NEW_UPSTREAM);

    await updateCommand(["slide-left"], {
      cwd: appDir(),
      registryUrl: registryDir,
    });

    expect(await fs.readFile(target(), "utf-8")).toBe(NEW_UPSTREAM);
  });

  it("keeps a file the user edited", async () => {
    await addCommand(["slide-left"], { cwd: appDir(), registryUrl: registryDir });
    const localEdit = "// my local edit\nexport const SlideLeft = 1;\n";
    await fs.writeFile(target(), localEdit);
    await publishUpstream(NEW_UPSTREAM);

    await updateCommand(["slide-left"], {
      cwd: appDir(),
      registryUrl: registryDir,
    });

    expect(await fs.readFile(target(), "utf-8")).toBe(localEdit);
  });

  it("keeps a differing file the lockfile has no record of", async () => {
    // Installed before the lockfile existed: no way to tell an edit apart.
    const untracked = "export const SlideLeft = () => 'old';\n";
    await fs.outputFile(target(), untracked);
    await publishUpstream(NEW_UPSTREAM);

    await updateCommand(["slide-left"], {
      cwd: appDir(),
      registryUrl: registryDir,
    });

    expect(await fs.readFile(target(), "utf-8")).toBe(untracked);
  });

  it("--yes overwrites a file the user edited", async () => {
    await addCommand(["slide-left"], { cwd: appDir(), registryUrl: registryDir });
    await fs.writeFile(target(), "// my local edit\n");
    await publishUpstream(NEW_UPSTREAM);

    await updateCommand(["slide-left"], {
      cwd: appDir(),
      registryUrl: registryDir,
      yes: true,
    });

    expect(await fs.readFile(target(), "utf-8")).toBe(NEW_UPSTREAM);
  });

  it("keeps tracking the file across successive registry changes", async () => {
    await addCommand(["slide-left"], { cwd: appDir(), registryUrl: registryDir });
    await publishUpstream(NEW_UPSTREAM);
    await updateCommand(["slide-left"], {
      cwd: appDir(),
      registryUrl: registryDir,
    });

    const third = "export const SlideLeft = () => 'v3';\n";
    await publishUpstream(third);
    await updateCommand(["slide-left"], {
      cwd: appDir(),
      registryUrl: registryDir,
    });

    expect(await fs.readFile(target(), "utf-8")).toBe(third);
  });

  it("reports the run as an update", async () => {
    await addCommand(["slide-left"], { cwd: appDir(), registryUrl: registryDir });
    const logSpy = vi.mocked(console.log);
    logSpy.mockClear();

    await updateCommand(["slide-left"], {
      cwd: appDir(),
      registryUrl: registryDir,
    });

    expect(logSpy.mock.calls.flat().join("\n")).toContain(
      "Updated 1 component(s) successfully.",
    );
  });
});
