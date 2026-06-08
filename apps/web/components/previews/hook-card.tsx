"use client";

import { Sequence } from "remotion";
import { HookCard } from "../registry-exports";

export const HookCardPreview: React.FC = () => (
  <Sequence from={-28}>
    <HookCard
      kicker="Creator media"
      headline="Make the first second count"
      subtitle="A punchy opener for reels, shorts, and launch clips."
    />
  </Sequence>
);
