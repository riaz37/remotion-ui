"use client";

import { PodcastClip } from "../registry-exports";
import { DEMO_AUDIO_SRC, DEMO_CAPTIONS } from "@/lib/demo-assets";

export const PodcastClipPreview: React.FC = () => (
  <PodcastClip audioSrc={DEMO_AUDIO_SRC} captions={DEMO_CAPTIONS} />
);
