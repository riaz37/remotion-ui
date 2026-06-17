"use client";

import { Sequence } from "remotion";
import { HeroLoop } from "../registry-exports";

export const HeroLoopPreview: React.FC = () => (
  <Sequence from={0}>
    <HeroLoop />
  </Sequence>
);
