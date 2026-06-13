"use client";

import { Sequence } from "remotion";
import { TutorialClip } from "../registry-exports";
import { DEMO_MEDIA_SRC } from "@/lib/demo-assets";

export const TutorialClipPreview: React.FC = () => (
  <Sequence from={-72}>
    <TutorialClip
      mediaSrc={DEMO_MEDIA_SRC}
      title="Show the product path"
      subtitle="One screen, one callout, one code beat"
      calloutTitle="Name the key action"
      calloutSubtitle="Keep attention on the product moment."
      code={`npx remotion-ui add media-frame\nnpx remotion-ui add callout-spotlight\nrender the walkthrough`}
      ctaTitle="Tutorial Cut"
    />
  </Sequence>
);
