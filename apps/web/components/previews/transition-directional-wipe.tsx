"use client";

import { transitionDirectionalWipe } from "../registry-exports";
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
  />
);
