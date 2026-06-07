"use client";

import { TutorialClip } from "../registry-exports";
import { DEMO_MEDIA_SRC } from "@/lib/demo-assets";

export const TutorialClipPreview: React.FC = () => (
  <TutorialClip mediaSrc={DEMO_MEDIA_SRC} />
);
