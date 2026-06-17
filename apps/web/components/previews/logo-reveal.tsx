"use client";

import { LogoReveal } from "../registry-exports";
import { DEMO_LOGO_PATH } from "@/lib/demo-assets";
import { ScenePreviewPlate } from "./scene-preview-plate";

export const LogoRevealPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <LogoReveal
      pathD={DEMO_LOGO_PATH}
      width={220}
      height={220}
      viewBox="0 0 200 200"
    />
  </ScenePreviewPlate>
);
