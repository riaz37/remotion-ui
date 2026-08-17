"use client";

import { Sequence } from "remotion";
import { ConfettiBurst } from "../registry-exports";
import { PreviewFrame, ProductCard } from "./preview-frame";
import { DEMO_COPY } from "@/lib/demo-assets";

/**
 * 96-frame window (matched in `lib/preview-config.ts` and the MDX page), so the
 * samples land on frames 14, 48 and 86.
 *
 * The origin sits below the card, not on the kicker line — at the enter sample
 * the burst is still bunched at its origin, and on the kicker that bunch printed
 * straight over the word. `gravity` is far under the 680 default because the
 * default clears a 540px frame in about a second and a half, which left the 90%
 * sample with no confetti in it at all; at 80 there is still a tail falling
 * through the lower half of the frame at frame 86.
 */
export const ConfettiBurstPreview: React.FC = () => (
  <PreviewFrame lane="atoms">
    <ProductCard
      kicker="Celebrate"
      title={DEMO_COPY.creatorHook.headline}
      detail={DEMO_COPY.creatorHook.subtitle}
    />
    <Sequence from={8} layout="none">
      <ConfettiBurst
        originX={50}
        originY={88}
        gravity={80}
        seed="docs-confetti"
        durationInFrames={88}
      />
    </Sequence>
  </PreviewFrame>
);
