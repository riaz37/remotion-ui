"use client";

import { Sequence } from "remotion";
import { HookCard } from "../registry-exports";
import { DEMO_COPY } from "@/lib/demo-assets";
import { ScenePreviewPlate } from "./scene-preview-plate";

/**
 * `holdSeconds` leaves across the 90% sample (frame 108 of 120 = 3.6s):
 * 0.9 x 120/30 - 0.79 x 0.42 = 3.27. Without it the hook was down by frame 48
 * and the only thing moving after that was a sub-perceptual gradient drift —
 * the 50% and 90% cells came back 47-54 dB apart, which is indistinguishable.
 */
export const HookCardPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <Sequence from={0}>
      <HookCard
        holdSeconds={3.27}
        kicker={DEMO_COPY.creatorHook.eyebrow}
        headline={DEMO_COPY.creatorHook.headline}
        emphasis="first second"
        subtitle={DEMO_COPY.creatorHook.subtitle}
      />
    </Sequence>
  </ScenePreviewPlate>
);
