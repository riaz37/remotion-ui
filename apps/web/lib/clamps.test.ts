import { describe, expect, it } from "vitest";
import { scanClamps } from "../scripts/scan-clamps.mjs";

/**
 * Guards the one `interpolate()` class that is unambiguously a bug.
 *
 * Remotion extrapolates by default, so a call driven straight off `frame` over
 * a bounded window keeps running the line before the window opens and after it
 * closes — negative opacities, scales that never stop growing, offsets that
 * walk out of frame. Nothing legitimate looks like that.
 *
 * Deliberately unclamped calls are a different shape and stay passing: springs
 * whose overshoot is the point, `Math.sin` and modulo drivers that are bounded
 * by construction, and progress values that a local `ease()` helper has already
 * clamped. See `scripts/scan-clamps.mts` for why each is left alone.
 */
describe("interpolate() clamping", () => {
  const scan = scanClamps();

  it("scans the whole catalog", () => {
    expect(scan.total).toBeGreaterThan(400);
  });

  it("never drives an unclamped interpolate straight off the frame counter", () => {
    const offenders = scan.unclamped
      .filter((call) => call.frameDriven)
      .map((call) => `${call.file}:${call.line} in=${call.input}`);

    expect(offenders).toEqual([]);
  });
});
