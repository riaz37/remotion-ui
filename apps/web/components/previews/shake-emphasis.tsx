"use client";

import { ShakeEmphasis } from "../registry-exports";
import { DEMO_COPY } from "@/lib/demo-assets";
import { PreviewFrame, ProductCard } from "./preview-frame";

/**
 * A single hit is 22 frames long, and the audit samples 42 and 48 frames apart
 * — one impact would be missed by all three. Repeating on 28 frames puts the
 * samples at 18, 4 and 24 frames into their own cycle, which is deep in the
 * decay, right on the hit, and back at rest. That is three visibly different
 * frames *and* an honest picture of the envelope; a period that left two
 * samples at rest would measure fine and show nothing.
 */
export const ShakeEmphasisPreview: React.FC = () => (
  <PreviewFrame lane="atoms" padding={72}>
    <ShakeEmphasis
      repeatEveryInFrames={28}
      durationInFrames={22}
      intensity={44}
      rotation={2.6}
      punch={0.08}
      frequency={20}
    >
      <ProductCard
        kicker="Impact"
        title="Shake emphasis"
        detail={DEMO_COPY.creatorHook.subtitle}
      />
    </ShakeEmphasis>
  </PreviewFrame>
);
