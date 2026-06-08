"use client";

import { Sequence } from "remotion";
import { CreatorReel } from "../registry-exports";
import {
  DEMO_AUDIO_SRC,
  DEMO_CAPTIONS,
  DEMO_MEDIA_ALT_SRC,
  DEMO_MEDIA_SRC,
  DEMO_MEDIA_THIRD_SRC,
} from "@/lib/demo-assets";

export const CreatorReelPreview: React.FC = () => (
  <Sequence from={-32}>
    <CreatorReel
      audioSrc={DEMO_AUDIO_SRC}
      mediaSrc={DEMO_MEDIA_ALT_SRC}
      mediaFit="contain"
      captions={DEMO_CAPTIONS}
      bRollItems={[
        { src: DEMO_MEDIA_SRC, title: "Script" },
        { src: DEMO_MEDIA_ALT_SRC, title: "Record" },
        { src: DEMO_MEDIA_THIRD_SRC, title: "Publish" },
      ]}
    />
  </Sequence>
);
