import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const COMPONENTS = join(__dirname, "..", "components");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

describe("preview imports", () => {
  // Registry modules call loadFont() at module top level. A barrel that
  // re-exports every component runs all of those loads on any page that touches
  // it, which is how a typewriter page ended up downloading the emoji font.
  it("no component imports a registry barrel", () => {
    const offenders = sourceFiles(COMPONENTS)
      .filter((file) => /from "[^"]*registry-exports"/.test(readFileSync(file, "utf8")))
      .map((file) => file.slice(COMPONENTS.length + 1));

    expect(offenders).toEqual([]);
  });
});
