"use client";

import { Sequence } from "remotion";
import { TutorialClip } from "../registry-exports";
import { DEMO_APP_PORTRAIT_SRC } from "@/lib/demo-assets";

export const TutorialClipPreview: React.FC = () => (
  <Sequence from={0}>
    <TutorialClip
      mediaSrc={DEMO_APP_PORTRAIT_SRC}
      mediaWidth={1080}
      mediaHeight={1920}
      title="Show the product path"
      subtitle="One screen, one callout, one code beat"
      calloutTarget={{ x: 76, y: 1060, width: 928, height: 160 }}
      calloutTitle="Name the key action"
      calloutSubtitle="Keep attention on the product moment."
      code={`npx remotion-ui add media-frame\nnpx remotion-ui add callout-spotlight\nrender the walkthrough`}
      ctaTitle="Tutorial Cut"
    />
  </Sequence>
);
