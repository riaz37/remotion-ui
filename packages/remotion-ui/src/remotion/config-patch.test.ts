import fs from "fs-extra";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  ensureBundlerAlias,
  patchRemotionConfigSource,
  supportsBundlerOverride,
} from "./config-patch.js";

const CREATE_VIDEO_CONFIG = `import { Config } from "@remotion/cli/config";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
`;

describe("supportsBundlerOverride", () => {
  it.each([
    ["4.0.547", true],
    ["^4.0.505", true],
    ["~4.0.499", true],
    ["4.0.498", false],
    ["^4.0.300", false],
    ["5.0.0", true],
    ["4.1.0", true],
    ["latest", true],
    [undefined, true],
  ])("%s -> %s", (version, expected) => {
    expect(supportsBundlerOverride(version)).toBe(expected);
  });
});

describe("patchRemotionConfigSource", () => {
  it("appends a bundler-wide alias to a create-video config", () => {
    const result = patchRemotionConfigSource(CREATE_VIDEO_CONFIG, "4.0.547");

    expect(result.status).toBe("added");
    expect(result.source).toContain('import path from "node:path";');
    expect(result.source).toContain("Config.overrideBundlerConfig(");
    expect(result.source).toContain('alias["@"] = path.resolve("./src")');
    expect(result.source).toContain("Config.setRspack(true);");
  });

  it("uses overrideWebpackConfig on Remotion versions without overrideBundlerConfig", () => {
    const result = patchRemotionConfigSource(CREATE_VIDEO_CONFIG, "^4.0.400");

    expect(result.status).toBe("added");
    expect(result.source).toContain("Config.overrideWebpackConfig(");
    expect(result.source).not.toContain("overrideBundlerConfig");
  });

  it("keeps an existing path import instead of adding a second one", () => {
    const source = `import path from "path";\n${CREATE_VIDEO_CONFIG}`;
    const result = patchRemotionConfigSource(source, "4.0.547");

    expect(result.source.match(/import path/g)).toHaveLength(1);
  });

  it("creates a config when the project has none", () => {
    const result = patchRemotionConfigSource(undefined, "4.0.547");

    expect(result.status).toBe("created");
    expect(result.source).toContain(
      'import { Config } from "@remotion/cli/config";',
    );
    expect(result.source).toContain("Config.overrideBundlerConfig(");
  });

  it("leaves a config that already aliases @ unchanged", () => {
    const source = `${CREATE_VIDEO_CONFIG}
Config.overrideWebpackConfig((c) => {
  c.resolve.alias["@"] = path.resolve("./src");
  return c;
});
`;
    const result = patchRemotionConfigSource(source, "4.0.547");

    expect(result.status).toBe("present");
    expect(result.source).toBe(source);
  });

  it("does not add a second override when the user already has one", () => {
    const source = `${CREATE_VIDEO_CONFIG}
Config.overrideWebpackConfig((c) => enableTailwind(c));
`;
    const result = patchRemotionConfigSource(source, "4.0.547");

    expect(result.status).toBe("manual");
    expect(result.source).toBe(source);
  });
});

describe("patchRemotionConfigSource edge cases", () => {
  it("ignores a commented-out override", () => {
    const result = patchRemotionConfigSource(
      `${CREATE_VIDEO_CONFIG}// Config.overrideWebpackConfig((c) => c);\n`,
      "4.0.547",
    );
    expect(result.status).toBe("added");
  });

  it("does not treat a commented-out alias as present", () => {
    const result = patchRemotionConfigSource(
      `${CREATE_VIDEO_CONFIG}// c.resolve.alias["@"] = x;\n`,
      "4.0.547",
    );
    expect(result.status).toBe("added");
  });

  it("leaves CommonJS configs for the user", () => {
    const source = 'const { Config } = require("@remotion/cli/config");\n';
    expect(patchRemotionConfigSource(source, "4.0.547").status).toBe("manual");
  });

  it("leaves a config with a non-default path import for the user", () => {
    const source = `import { resolve } from "node:path";\n${CREATE_VIDEO_CONFIG}`;
    expect(patchRemotionConfigSource(source, "4.0.547").status).toBe("manual");
  });

  it("does not duplicate a const path binding", () => {
    const source = `${CREATE_VIDEO_CONFIG}const path = await import("node:path");\n`;
    const result = patchRemotionConfigSource(source, "4.0.547");
    expect(result.source).not.toContain('import path from "node:path";');
  });

  it("keeps a shebang and directive on top", () => {
    const source = '#!/usr/bin/env node\n"use strict";\nConfig.setRspack(true);\n';
    const result = patchRemotionConfigSource(source, "4.0.547");
    expect(result.source.startsWith('#!/usr/bin/env node\n"use strict";\nimport path')).toBe(true);
  });
});

describe("ensureBundlerAlias", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "remotion-ui-config-"));
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  it("writes the patched config to disk", async () => {
    const configPath = path.join(tempDir, "remotion.config.ts");
    await fs.writeFile(configPath, CREATE_VIDEO_CONFIG);

    const { status } = await ensureBundlerAlias(tempDir, "4.0.547");

    expect(status).toBe("added");
    expect(await fs.readFile(configPath, "utf-8")).toContain(
      "Config.overrideBundlerConfig(",
    );
  });

  it("creates the config file when missing", async () => {
    const { status } = await ensureBundlerAlias(tempDir, "4.0.547");

    expect(status).toBe("created");
    expect(
      await fs.pathExists(path.join(tempDir, "remotion.config.ts")),
    ).toBe(true);
  });
  it("prints instead of creating a .ts next to a .js config", async () => {
    await fs.writeFile(path.join(tempDir, "remotion.config.js"), CREATE_VIDEO_CONFIG);

    const { status, configFile } = await ensureBundlerAlias(tempDir, "4.0.547");

    expect(status).toBe("manual");
    expect(configFile).toBe("remotion.config.js");
    expect(await fs.pathExists(path.join(tempDir, "remotion.config.ts"))).toBe(false);
  });

  it("uses the installed version over a loose package.json range", async () => {
    await fs.outputJson(path.join(tempDir, "node_modules/remotion/package.json"), {
      version: "4.0.547",
    });

    const { version } = await ensureBundlerAlias(tempDir, ">=4.0.400");

    expect(version).toBe("4.0.547");
  });
});
