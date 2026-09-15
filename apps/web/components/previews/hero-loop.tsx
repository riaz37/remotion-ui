"use client";

import { Sequence } from "remotion";
import {
  HeroLoop,
  type HeroLoopProps,
} from "../../registry/bases/default/compositions/hero-loop";

/**
 * Forwards props so a Player can pass `inputProps` straight through: the
 * homepage monitor asks for the transparent background and the page's theme
 * tone, while docs and renders use the default phosphor stage.
 */
export const HeroLoopPreview: React.FC<HeroLoopProps> = (props) => (
  <Sequence from={0}>
    <HeroLoop {...props} />
  </Sequence>
);
