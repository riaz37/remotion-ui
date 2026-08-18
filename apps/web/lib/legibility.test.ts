import { describe, expect, it } from "vitest";
import { LEGIBILITY_FLOOR_PX, scanLegibility } from "../scripts/scan-legibility.mjs";

/**
 * Guards the D1 floor.
 *
 * Scene type is authored in abstract units and multiplied by `u` at render
 * time, which is exactly why the catalog drifted under the floor without anyone
 * noticing: a "15 unit" label reads as generous in the source and resolves to
 * 11px on the 960 docs stage — 3.6px once the contact sheet reduces it. Nothing
 * in review catches that, so a test does.
 *
 * Deliberate exceptions live in `EXCEPTIONS` in the scanner, commented at both
 * ends. Adding one should be an argued decision, not a way to make this pass.
 */
describe("D1 legibility", () => {
  const scan = scanLegibility();

  it("resolves the catalog's unit-scaled type", () => {
    expect(scan.resolved).toBeGreaterThan(100);
  });

  it(`keeps meaning-carrying type at or above ${LEGIBILITY_FLOOR_PX}px on the docs stage`, () => {
    expect(
      scan.under.map((site) => `${site.file}:${site.line} ${site.px.toFixed(1)}px`),
    ).toEqual([]);
  });
});
