"use client";

import { LogoReveal } from "../registry-exports";
import { DEMO_LOGO_PATH } from "@/lib/demo-assets";
import { ScenePreviewPlate } from "./scene-preview-plate";

export const LogoRevealPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <LogoReveal
      pathD={DEMO_LOGO_PATH}
      wordmark="Remotion UI"
      tagline="Copy-paste motion components"
    />
  </ScenePreviewPlate>
);
