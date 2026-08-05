import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  getComponentDetailHandler,
  getInstallCommandHandler,
  listComponentsHandler,
  searchComponentsHandler,
} from "../src/tools.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_REGISTRY = path.join(
  __dirname,
  "../../remotion-ui/test/fixtures/registry",
);

function parseText(result: { content: { type: string; text: string }[] }) {
  return JSON.parse(result.content[0]!.text);
}

describe("listComponentsHandler", () => {
  it("returns the registry index", async () => {
    const result = await listComponentsHandler({
      registryUrl: FIXTURE_REGISTRY,
    });

    expect(result.isError).toBeUndefined();
    const data = parseText(result);
    expect(Array.isArray(data.items)).toBe(true);
    expect(data.items.some((item: { name: string }) => item.name === "fade-in")).toBe(
      true,
    );
  });

  it("returns a structured error when the registry index is missing", async () => {
    const result = await listComponentsHandler({
      registryUrl: path.join(__dirname, "does-not-exist"),
    });

    expect(result.isError).toBe(true);
    const data = parseText(result);
    expect(data.code).toBe("REGISTRY_FETCH_FAILED");
  });
});

describe("searchComponentsHandler", () => {
  it("filters items by query", async () => {
    const result = await searchComponentsHandler({
      registryUrl: FIXTURE_REGISTRY,
      query: "fade",
    });

    expect(result.isError).toBeUndefined();
    const data = parseText(result);
    expect(data.count).toBe(1);
    expect(data.items[0].name).toBe("fade-in");
  });

  it("returns a structured error when the registry index is missing", async () => {
    const result = await searchComponentsHandler({
      registryUrl: path.join(__dirname, "does-not-exist"),
    });

    expect(result.isError).toBe(true);
    const data = parseText(result);
    expect(data.code).toBe("REGISTRY_FETCH_FAILED");
  });
});

describe("getComponentDetailHandler", () => {
  it("returns the full registry item", async () => {
    const result = await getComponentDetailHandler({
      name: "fade-in",
      registryUrl: FIXTURE_REGISTRY,
    });

    expect(result.isError).toBeUndefined();
    const data = parseText(result);
    expect(data.name).toBe("fade-in");
    expect(Array.isArray(data.files)).toBe(true);
  });

  it("surfaces a REGISTRY_ITEM_NOT_FOUND error for a nonexistent name", async () => {
    const result = await getComponentDetailHandler({
      name: "does-not-exist",
      registryUrl: FIXTURE_REGISTRY,
    });

    expect(result.isError).toBe(true);
    const data = parseText(result);
    expect(data.code).toBe("REGISTRY_ITEM_NOT_FOUND");
  });
});

describe("getInstallCommandHandler", () => {
  it("returns the install command string", () => {
    const result = getInstallCommandHandler({ name: "fade-in" });

    expect(result.isError).toBeUndefined();
    const data = parseText(result);
    expect(data.command).toBe("npx remotion-ui@latest add fade-in");
  });
});
