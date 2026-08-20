import { execSync } from "node:child_process";
import fs from "fs-extra";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initCommand } from "./init.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

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
    const remotionConfig = await fs.readFile(
      path.join(tempDir, "my-video", "remotion.config.ts"),
      "utf-8",
    );
    const composition = await fs.readFile(
      path.join(tempDir, "my-video", "src/compositions/welcome/index.tsx"),
      "utf-8",
    );

    expect(root).toContain('id="Welcome"');
    expect(root).toContain("WelcomeComposition");
    expect(composition).toContain("Your first composition is ready.");
    expect(remotionConfig).toContain('currentConfiguration.resolve.alias["@"]');
    expect(consoleSpy.mock.calls.flat().join("\n")).toContain(
      "npx remotion-ui add intro",
    );
  });

  it("non-json error text is unchanged when the target directory already exists", async () => {
    await fs.ensureDir(path.join(tempDir, "my-video"));

    await expect(
      initCommand("my-video", { cwd: tempDir }),
    ).rejects.toThrow(/Directory already exists/);
  });

  it("--json + an existing target directory produces a valid {ok:false} JSON blob on stdout", async () => {
    await fs.ensureDir(path.join(tempDir, "my-video"));

    await expect(
      initCommand("my-video", { cwd: tempDir, json: true }),
    ).rejects.toThrow(/Directory already exists/);

    const stdout = consoleSpy.mock.calls.map((call: unknown[]) => call.join(" ")).join("\n");
    const parsed = JSON.parse(stdout);
    expect(parsed.ok).toBe(false);
    expect(parsed.error.code).toBe("TARGET_EXISTS");
  });

  it("--json + a successful scaffold produces a single valid JSON object on stdout", async () => {
    await initCommand("my-video", { cwd: tempDir, json: true });

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    const stdout = consoleSpy.mock.calls[0]?.join(" ") ?? "";
    const parsed = JSON.parse(stdout);
    expect(parsed.ok).toBe(true);
    expect(parsed.existing).toBe(false);
    expect(parsed.projectDir).toBe(path.join(tempDir, "my-video"));
  });

  describe("agent skill install", () => {
    const skillPath = (root: string) =>
      path.join(root, ".claude", "skills", "remotionui-agent", "SKILL.md");

    it("installs the agent skill by default for --existing", async () => {
      await fs.writeJson(path.join(tempDir, "package.json"), {
        name: "existing-app",
        dependencies: { remotion: "^4.0.0" },
      });

      await initCommand("my-video", { cwd: tempDir, existing: true });

      const installed = await fs.pathExists(skillPath(tempDir));
      expect(installed).toBe(true);

      const content = await fs.readFile(skillPath(tempDir), "utf-8");
      const template = await fs.readFile(
        path.resolve(currentDir, "../../templates/agent-skill/SKILL.md"),
        "utf-8",
      );
      expect(content).toBe(template);
    });

    it("--existing --no-agent-skill skips installing the skill", async () => {
      await fs.writeJson(path.join(tempDir, "package.json"), {
        name: "existing-app",
        dependencies: { remotion: "^4.0.0" },
      });

      await initCommand("my-video", {
        cwd: tempDir,
        existing: true,
        agentSkill: false,
      });

      expect(await fs.pathExists(skillPath(tempDir))).toBe(false);
    });

    it("fresh scaffold does not install the skill by default", async () => {
      await initCommand("my-video", { cwd: tempDir });

      expect(
        await fs.pathExists(skillPath(path.join(tempDir, "my-video"))),
      ).toBe(false);
    });

    it("fresh scaffold with --agent-skill installs the skill", async () => {
      await initCommand("my-video", { cwd: tempDir, agentSkill: true });

      expect(
        await fs.pathExists(skillPath(path.join(tempDir, "my-video"))),
      ).toBe(true);
    });
  });

  describe("installSkill flag resolution", () => {
    const resolve = (agentSkill: boolean | undefined, existing: boolean) =>
      agentSkill ?? Boolean(existing);

    it.each([
      [true, true, true],
      [true, false, true],
      [false, true, false],
      [false, false, false],
      [undefined, true, true],
      [undefined, false, false],
    ])(
      "agentSkill=%s existing=%s => %s",
      (agentSkill, existing, expected) => {
        expect(resolve(agentSkill, existing)).toBe(expected);
      },
    );
  });
});
