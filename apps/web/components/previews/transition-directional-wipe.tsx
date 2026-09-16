"use client";

import { transitionDirectionalWipe } from "../../registry/bases/default/primitives/directional-wipe";
import {
  TRANSITION_FRAMES,
  TransitionSeriesPreview,
} from "./transition-previews";

export const TransitionDirectionalWipePreview: React.FC = () => (
  <TransitionSeriesPreview
    transition={transitionDirectionalWipe({
      durationInFrames: TRANSITION_FRAMES,
      direction: "from-left",
    })}
    label={{
      name: "Directional wipe",
      beforeDetail: "Covered by a wipe sweeping in from the left",
      afterDetail: "Uncovered as the wipe clears to the right",
    }}
  />
);
