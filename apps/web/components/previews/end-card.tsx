"use client";

import { EndCard } from "../registry-exports";
import { DEMO_LOGO_SRC } from "@/lib/demo-assets";

export const EndCardPreview: React.FC = () => (
  <EndCard
    title="RemotionUI"
    cta="npx remotion-ui add"
    url="remotionui.com"
    logoSrc={DEMO_LOGO_SRC}
  />
);
