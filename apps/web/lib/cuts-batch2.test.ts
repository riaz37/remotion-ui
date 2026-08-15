import { describe, expect, it } from "vitest";
import { getTransitionBlindsDuration } from "../registry/bases/default/primitives/transition-blinds";
import { getTransitionCardFlipDuration } from "../registry/bases/default/primitives/transition-card-flip";
import { getTransitionCircleRevealDuration } from "../registry/bases/default/primitives/transition-circle-reveal";
import { getTransitionLiquidWarpDuration } from "../registry/bases/default/primitives/transition-liquid-warp";
import {
  SHAPE_OVERSHOOT,
  getTransitionMorphShapeDuration,
} from "../registry/bases/default/primitives/transition-morph-shape";
import { getTransitionWhipPanDuration } from "../registry/bases/default/primitives/transition-whip-pan";
import { MORPH_SHAPES } from "../registry/bases/default/lib/path-morph";

/**
 * A `TransitionSeries` total is `sum(sequences) - sum(transitions)`, so a
 * transition whose reported duration disagrees with the one it actually
 * consumes silently shortens the composition — and the symptom shows up at the
 * *end* of the video, nowhere near the transition. These pin the number every
 * caller does that arithmetic with.
 */
const DURATION_HELPERS = [
  ["transition-circle-reveal", getTransitionCircleRevealDuration, 22],
  ["transition-card-flip", getTransitionCardFlipDuration, 24],
  ["transition-blinds", getTransitionBlindsDuration, 24],
  ["transition-whip-pan", getTransitionWhipPanDuration, 14],
  ["transition-morph-shape", getTransitionMorphShapeDuration, 24],
  ["transition-liquid-warp", getTransitionLiquidWarpDuration, 26],
] as const;

describe("cuts batch 2 durations", () => {
  it.each(DURATION_HELPERS)(
    "%s reports its documented default",
    (_slug, helper, expected) => {
      expect(helper({}, 30)).toBe(expected);
    },
  );

  it.each(DURATION_HELPERS)("%s honours an explicit length", (_slug, helper) => {
    expect(helper({ durationInFrames: 31 }, 30)).toBe(31);
  });
});

describe("morph-shape overshoot table", () => {
  it("covers every shipped morph preset", () => {
    for (const name of Object.keys(MORPH_SHAPES)) {
      expect(
        SHAPE_OVERSHOOT[name],
        `no overshoot figure for "${name}" — it would fall back to the circle figure and leave the frame corners unrevealed`,
      ).toBeGreaterThan(0);
    }
  });

  it("gives pointed shapes more room than round ones", () => {
    // The mask is sized against the frame diagonal, which is exactly right for
    // a circle and short for anything with a point.
    expect(SHAPE_OVERSHOOT.diamond).toBeGreaterThan(SHAPE_OVERSHOOT.circle);
    expect(SHAPE_OVERSHOOT.triangle).toBeGreaterThan(SHAPE_OVERSHOOT.diamond);
  });
});
