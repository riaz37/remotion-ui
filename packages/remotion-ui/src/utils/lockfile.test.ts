import fs from "fs-extra";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LOCKFILE_NAME, readLockfile } from "./lockfile.js";

describe("readLockfile", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "remotion-ui-lock-"));
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  it("treats a merge-conflicted lockfile as empty instead of throwing", async () => {
    await fs.writeFile(
      path.join(tempDir, LOCKFILE_NAME),
      '<<<<<<< HEAD\n{"version":1,"files":{}}\n=======\n',
    );

    await expect(readLockfile(tempDir)).resolves.toEqual({
      version: 1,
      files: {},
    });
  });

  it("treats a lockfile of the wrong shape as empty", async () => {
    await fs.writeJson(path.join(tempDir, LOCKFILE_NAME), { version: 2 });

    await expect(readLockfile(tempDir)).resolves.toEqual({
      version: 1,
      files: {},
    });
  });
});
