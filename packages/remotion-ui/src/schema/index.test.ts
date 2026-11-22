import { describe, expect, it } from "vitest";
import { registryIndexSchema, registryItemSchema } from "./index.js";

// Atlas metadata is display-only: the CLI filters on it but never branches on
// its values. Registries add lanes over time, and an older CLI must keep
// reading them instead of rejecting the whole index.
const futureAtlas = {
  lane: "a-lane-this-cli-has-never-seen",
  drive: "a-new-drive",
  tier: "a-new-tier",
  tags: ["x"],
};

describe("atlas metadata", () => {
  it.each(["motion", "shaders", "3d"])(
    "accepts the live registry lane %s on an item",
    (lane) => {
      const result = registryItemSchema.safeParse({
        name: "shape-layer",
        type: "registry:component",
        atlas: { lane, drive: "time", tier: "core" },
        files: [],
      });

      expect(result.success).toBe(true);
    },
  );

  it("accepts lanes, drives and tiers added after this CLI shipped", () => {
    const result = registryIndexSchema.safeParse({
      name: "remotionui",
      items: [{ name: "future", type: "registry:component", atlas: futureAtlas }],
    });

    expect(result.success).toBe(true);
  });

  it("still rejects atlas metadata of the wrong shape", () => {
    const result = registryItemSchema.safeParse({
      name: "broken",
      type: "registry:component",
      atlas: { lane: 3, drive: "time", tier: "core" },
      files: [],
    });

    expect(result.success).toBe(false);
  });
});
