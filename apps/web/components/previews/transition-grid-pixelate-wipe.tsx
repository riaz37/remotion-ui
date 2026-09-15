"use client";

import { transitionGridPixelateWipe } from "../../registry/bases/default/primitives/grid-pixelate-wipe";
import {
  TRANSITION_FRAMES,
  TransitionSeriesPreview,
} from "./transition-previews";

export const TransitionGridPixelateWipePreview: React.FC = () => (
  <TransitionSeriesPreview
    transition={transitionGridPixelateWipe({
      durationInFrames: TRANSITION_FRAMES,
    })}
  />
);
