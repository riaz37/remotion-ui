import fs from "fs-extra";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { importAeCommand } from "./import-ae.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const appFixture = path.resolve(here, "../../test/fixtures/remotion-app");
const lottieFixtures = path.resolve(here, "../../test/fixtures/lottie");

const textLayerLottie = JSON.stringify({
  v: "5.7.0",
  fr: 30,
  ip: 0,
  op: 30,
  w: 100,
  h: 100,
  layers: [
    { ty: 5, nm: "Headline", ind: 1, ip: 0, op: 30, ks: {} },
    { ty: 4, nm: "Dot", ind: 2, ip: 0, op: 30, ks: {}, shapes: [{ ty: "el", p: { a: 0, k: [50, 50] }, s: { a: 0, k: [10, 10] } }, { ty: "fl", c: { a: 0, k: [0, 0, 0, 1] } }] },
  ],
});

describe("importAeCommand", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "remotion-ui-import-ae-"));
    await fs.copy(appFixture, tempDir, { filter: (src) => !src.includes("node_modules") });
    await fs.copy(path.join(lottieFixtures, "bouncy-ball.json"), path.join(tempDir, "bouncy-ball.json"));
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await fs.remove(tempDir);
  });

  it("writes the composition under the compositions alias and registers it in Root.tsx", async () => {
    const result = await importAeCommand("bouncy-ball.json", { cwd: tempDir, install: false });
    expect(result.files).toEqual([path.join("src", "compositions", "bouncy-ball", "index.tsx")]);
    const code = await fs.readFile(path.join(tempDir, result.files[0]), "utf-8");
    expect(code).toContain('from "@/remotion/lib/ae-import"');
    expect(code).toContain("export const BouncyBall = () => (");
    const root = await fs.readFile(path.join(tempDir, "src/Root.tsx"), "utf-8");
    expect(root).toContain('import { BouncyBall } from "@/compositions/bouncy-ball/index";');
    expect(root).toContain('id="BouncyBall"');
    expect(root).toContain("durationInFrames={120}");
    expect(root).toContain("fps={60}");
    expect(result.registered).toBe(true);
  });

  it("honours --out and --name, and refuses to overwrite without --force", async () => {
    const options = { cwd: tempDir, out: "anim", name: "Ball", install: false, register: false };
    await importAeCommand("bouncy-ball.json", options);
    expect(await fs.pathExists(path.join(tempDir, "anim/index.tsx"))).toBe(true);
    await expect(importAeCommand("bouncy-ball.json", options)).rejects.toMatchObject({ code: "TARGET_EXISTS" });
    await expect(importAeCommand("bouncy-ball.json", { ...options, force: true })).resolves.toMatchObject({ ok: true });
  });

  it("fails loudly on unsupported features and writes nothing", async () => {
    await fs.writeFile(path.join(tempDir, "text.json"), textLayerLottie);
    const error = await importAeCommand("text.json", { cwd: tempDir, install: false }).catch((e: unknown) => e);
    expect(error).toMatchObject({ code: "LOTTIE_UNSUPPORTED" });
    expect((error as Error).message).toContain('text layer at layer "Headline" ($.layers[0])');
    expect((error as Error).message).toContain("--skip-unsupported");
    expect(await fs.pathExists(path.join(tempDir, "src/compositions/text"))).toBe(false);
  });

  it("generates past unsupported features with --skip-unsupported and lists them", async () => {
    await fs.writeFile(path.join(tempDir, "text.json"), textLayerLottie);
    const result = await importAeCommand("text.json", { cwd: tempDir, install: false, register: false, skipUnsupported: true, name: "Text" });
    const code = await fs.readFile(path.join(tempDir, result.files[0]), "utf-8");
    expect(code).toContain("Not imported (generated with --skip-unsupported):");
    expect(code).toContain('text layer: layer "Headline"');
    expect(code).toContain("nullLayer({");
  });

  it("validates arguments and input", async () => {
    await expect(importAeCommand("missing.json", { cwd: tempDir })).rejects.toMatchObject({ code: "INVALID_ARGS" });
    await expect(importAeCommand("bouncy-ball.json", { cwd: tempDir, name: "not-pascal" })).rejects.toMatchObject({ code: "INVALID_ARGS" });
    await fs.writeFile(path.join(tempDir, "bad.json"), "[]");
    await expect(importAeCommand("bad.json", { cwd: tempDir })).rejects.toMatchObject({ code: "LOTTIE_INVALID" });
  });

  it("works outside a RemotionUI project, writing next to the cwd", async () => {
    const bare = await fs.mkdtemp(path.join(os.tmpdir(), "remotion-ui-import-ae-bare-"));
    try {
      await fs.copy(path.join(lottieFixtures, "bouncy-ball.json"), path.join(bare, "ball.json"));
      const result = await importAeCommand("ball.json", { cwd: bare });
      expect(result.files).toEqual([path.join("bouncy-ball", "index.tsx")]);
      expect(result.registered).toBe(false);
    } finally {
      await fs.remove(bare);
    }
  });
});
