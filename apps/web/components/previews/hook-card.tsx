"use client";

import { Sequence } from "remotion";
import { HookCard } from "../registry-exports";
import { DEMO_COPY } from "@/lib/demo-assets";
import { ScenePreviewPlate } from "./scene-preview-plate";

export const HookCardPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <Sequence from={0}>
      <HookCard
        kicker={DEMO_COPY.creatorHook.eyebrow}
        headline={DEMO_COPY.creatorHook.headline}
        subtitle={DEMO_COPY.creatorHook.subtitle}
      />
    </Sequence>
  </ScenePreviewPlate>
);
