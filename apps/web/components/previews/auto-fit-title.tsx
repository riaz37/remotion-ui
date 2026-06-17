"use client";

import { AutoFitTitle } from "../registry-exports";
import { DEMO_COPY, DEMO_LOGO_SRC } from "@/lib/demo-assets";
import { ScenePreviewPlate } from "./scene-preview-plate";

export const AutoFitTitlePreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <AutoFitTitle
      title={DEMO_COPY.productLaunch.title}
      subtitle={DEMO_COPY.productLaunch.subtitle}
      logoSrc={DEMO_LOGO_SRC}
    />
  </ScenePreviewPlate>
);
