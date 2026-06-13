"use client";

import { Sequence } from "remotion";
import { HeroLoop } from "../registry-exports";

export const HeroLoopPreview: React.FC = () => (
  <Sequence from={-24}>
    <HeroLoop />
  </Sequence>
);
