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
  />
);
