"use client";

import { MediaSequence } from "../registry-exports";
import {
  DEMO_MEDIA_ALT_SRC,
  DEMO_MEDIA_SRC,
  DEMO_MEDIA_THIRD_SRC,
} from "@/lib/demo-assets";

export const MediaSequencePreview: React.FC = () => (
  <MediaSequence
    items={[
      { src: DEMO_MEDIA_SRC, title: "Hook", caption: "Start with the product." },
      { src: DEMO_MEDIA_ALT_SRC, title: "Context", caption: "Show the story." },
      { src: DEMO_MEDIA_THIRD_SRC, title: "CTA", caption: "End with action." },
    ]}
    defaultDurationInFrames={54}
  />
);
