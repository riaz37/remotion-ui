"use client";

import { Sequence } from "remotion";
import { HeroLoop } from "../registry-exports";

export const HeroLoopPreview: React.FC = () => (
  <Sequence from={-88}>
    <HeroLoop />
  </Sequence>
);
