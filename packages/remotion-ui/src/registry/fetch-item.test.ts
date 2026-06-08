import { describe, expect, it } from "vitest";
import { DEFAULT_REGISTRY_URL } from "./fetch-item.js";

describe("fetchRegistryItem", () => {
  it("defaults to the hosted registry URL", () => {
    expect(DEFAULT_REGISTRY_URL).toBe("https://remotionui.vercel.app/r");
  });
});
