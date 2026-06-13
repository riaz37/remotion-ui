"use client";

import { Sequence } from "remotion";
import { AudiogramScene } from "../registry-exports";
import { DEMO_AUDIO_SRC, DEMO_LOGO_SRC } from "@/lib/demo-assets";
import { siteConfig } from "@/lib/site-config";

export const AudiogramScenePreview: React.FC = () => (
  <Sequence from={-20}>
    <AudiogramScene
      src={DEMO_AUDIO_SRC}
      title={siteConfig.name}
      subtitle="Production-ready motion for Remotion"
      logoSrc={DEMO_LOGO_SRC}
    />
  </Sequence>
);
