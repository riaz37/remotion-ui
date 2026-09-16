"use client";

import { transitionFrostedGlassWipe } from "../../registry/bases/default/primitives/frosted-glass-wipe";
import {
  TRANSITION_FRAMES,
  TransitionSeriesPreview,
} from "./transition-previews";

export const TransitionFrostedGlassWipePreview: React.FC = () => (
  <TransitionSeriesPreview
    transition={transitionFrostedGlassWipe({
      durationInFrames: TRANSITION_FRAMES,
    })}
    label={{
      name: "Frosted glass wipe",
      beforeDetail: "Blurs out behind a frosted-glass pane",
      afterDetail: "Comes into focus as the pane slides clear",
    }}
  />
);
