import path from "node:path";
import { describe, expect, it } from "vitest";
import { remotionUiConfigSchema } from "../schema/index.js";
import {
  getAliasForType,
  getCategoryFromPath,
  resolveInstallPath,
} from "./get-config.js";

const config = remotionUiConfigSchema.parse({
  preset: "default",
  aliases: {
    primitives: "@/remotion/primitives",
    scenes: "@/remotion/scenes",
    compositions: "@/compositions",
    lib: "@/remotion/lib",
    hooks: "@/remotion/hooks",
  },
});

const cwd = "/project";

describe("getCategoryFromPath", () => {
  it("detects primitives", () => {
    expect(
      getCategoryFromPath("registry/bases/default/primitives/fade-in.tsx"),
    ).toEqual({
      key: "primitives",
      relativePath: "fade-in.tsx",
    });
  });

  it("detects scenes", () => {
    expect(
      getCategoryFromPath(
        "registry/bases/default/scenes/lower-third/index.tsx",
      ),
    ).toEqual({
      key: "scenes",
      relativePath: "lower-third/index.tsx",
    });
  });

  it("detects compositions", () => {
    expect(
      getCategoryFromPath(
        "registry/bases/default/compositions/intro/index.tsx",
      ),
    ).toEqual({
      key: "compositions",
      relativePath: "intro/index.tsx",
    });
  });

  it("detects lib", () => {
    expect(getCategoryFromPath("registry/bases/default/lib/timing.ts")).toEqual(
      {
        key: "lib",
        relativePath: "timing.ts",
      },
    );
  });
});

describe("resolveInstallPath", () => {
  it("routes primitives to aliases.primitives", () => {
    expect(
      resolveInstallPath(cwd, config, {
        path: "registry/bases/default/primitives/fade-in.tsx",
        type: "registry:ui",
      }),
    ).toBe(path.join(cwd, "src/remotion/primitives/fade-in.tsx"));
  });

  it("routes scenes to aliases.scenes", () => {
    expect(
      resolveInstallPath(cwd, config, {
        path: "registry/bases/default/scenes/lower-third/index.tsx",
        type: "registry:block",
      }),
    ).toBe(path.join(cwd, "src/remotion/scenes/lower-third/index.tsx"));
  });

  it("routes compositions to aliases.compositions", () => {
    expect(
      resolveInstallPath(cwd, config, {
        path: "registry/bases/default/compositions/intro/index.tsx",
        type: "registry:block",
      }),
    ).toBe(path.join(cwd, "src/compositions/intro/index.tsx"));
  });

  it("routes lib files to aliases.lib", () => {
    expect(
      resolveInstallPath(cwd, config, {
        path: "registry/bases/default/lib/timing.ts",
        type: "registry:lib",
      }),
    ).toBe(path.join(cwd, "src/remotion/lib/timing.ts"));
  });

  it("rejects explicit targets outside the project", () => {
    expect(() =>
      resolveInstallPath(cwd, config, {
        path: "registry/bases/default/lib/timing.ts",
        type: "registry:lib",
        target: "../outside.ts",
      }),
    ).toThrow("outside the project");
  });

  it("rejects registry paths that escape alias directories", () => {
    expect(() =>
      resolveInstallPath(cwd, config, {
        path: "registry/bases/default/lib/../../outside.ts",
        type: "registry:lib",
      }),
    ).toThrow("outside the install directory");
  });
});

describe("getAliasForType", () => {
  it("falls back to type mapping without file path", () => {
    expect(getAliasForType(config, "registry:ui")).toBe(
      config.aliases.primitives,
    );
    expect(getAliasForType(config, "registry:lib")).toBe(config.aliases.lib);
  });

  it("prefers path-based routing for block items", () => {
    expect(
      getAliasForType(config, "registry:block", "foo/compositions/intro/x.tsx"),
    ).toBe(config.aliases.compositions);
  });
});
