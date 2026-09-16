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
    label={{
      name: "Grid pixelate wipe",
      beforeDetail: "Dissolves into a mosaic of blocks",
      afterDetail: "Resolves back out of the pixel grid",
    }}
  />
);
