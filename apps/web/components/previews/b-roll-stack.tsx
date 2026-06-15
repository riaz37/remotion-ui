"use client";

import { BRollStack } from "../registry-exports";
import {
  DEMO_MEDIA_ALT_SRC,
  DEMO_MEDIA_SRC,
  DEMO_MEDIA_THIRD_SRC,
} from "@/lib/demo-assets";

export const BRollStackPreview: React.FC = () => (
  <BRollStack
    kicker="Cutaway"
    title="Layer supporting visuals"
    items={[
      { src: DEMO_MEDIA_SRC, title: "Hook" },
      { src: DEMO_MEDIA_ALT_SRC, title: "Proof" },
      { src: DEMO_MEDIA_THIRD_SRC, title: "CTA" },
    ]}
  />
);
