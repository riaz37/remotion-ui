"use client";

import { transitionMorphShape } from "../../registry/bases/default/primitives/transition-morph-shape";
import {
  TRANSITION_FRAMES,
  TransitionSeriesPreview,
} from "./transition-previews";

/**
 * Timed at `TRANSITION_FRAMES` so the two scenes still fill the preview
 * composition exactly (69 + 69 - 18 = 120) and the cut itself straddles the
 * audit's 50% sample. A transition preview timed any other way samples two
 * still scenes and reads as dead.
 *
 * Shapes left at their defaults: the per-shape overshoot table only applies
 * when `overshoot` is not passed, and the preview should exercise the path a
 * caller actually takes.
 */
export const TransitionMorphShapePreview: React.FC = () => (
  <TransitionSeriesPreview
    transition={transitionMorphShape({
      durationInFrames: TRANSITION_FRAMES,
    })}
    label={{
      name: "Morph shape",
      beforeDetail: "Contracts into a morphing shape mask",
      afterDetail: "Expands back out of the shape",
    }}
  />
);
