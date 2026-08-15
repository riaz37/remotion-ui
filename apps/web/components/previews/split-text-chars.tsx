"use client";

import { SplitTextChars } from "../registry-exports";
import { DEMO_COPY } from "@/lib/demo-assets";
import { PreviewFrame } from "./preview-frame";

/**
 * Preview timing convention (see `text-effects-previews.tsx`).
 *
 * The audit samples at 15% / 50% / 90% of the window — frames 18, 60 and 108 on
 * the 120-frame default. A stagger left on its own defaults finishes long
 * before frame 18 and all three samples land on settled type, which reads as a
 * still image. The stagger here runs frames 2-64 so the line is half-arrived at
 * the first sample and whole at the second, and the exit wave starts at 90 so
 * it is mid-departure at the third.
 */

/** Text primitives render a bare inline `<span>` — the layout is the preview's. */
const stage = {
  display: "grid",
  placeItems: "center",
  width: "100%",
  textAlign: "center" as const,
};

export const SplitTextCharsPreview: React.FC = () => (
  <PreviewFrame lane="atoms" padding={72}>
    <div style={stage}>
      <SplitTextChars
        text={DEMO_COPY.productLaunch.featureTitle}
        mode="chars"
        order="start"
        effect="fade-up"
        delayInFrames={2}
        staggerInFrames={2}
        durationInFrames={22}
        exitAtInFrames={90}
        exitInFrames={20}
        exitStaggerInFrames={1}
        fontSize={64}
      />
    </div>
  </PreviewFrame>
);
