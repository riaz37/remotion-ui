"use client";

import { transitionWhipPan } from "../registry-exports";
import {
  TRANSITION_FRAMES,
  TransitionSeriesPreview,
} from "./transition-previews";

/**
 * Timed at `TRANSITION_FRAMES` so the two scenes still fill the preview
 * composition exactly (69 + 69 - 18 = 120) and the cut itself straddles the
 * audit's 50% sample. A transition preview timed any other way samples two
 * still scenes and reads as dead.
 */
export const TransitionWhipPanPreview: React.FC = () => (
  <TransitionSeriesPreview
    transition={transitionWhipPan({
      durationInFrames: TRANSITION_FRAMES,
      direction: "from-left",
    })}
  />
);
