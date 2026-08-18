"use client";

import { LogoReveal } from "../registry-exports";
import { DEMO_LOGO_PATH } from "@/lib/demo-assets";
import { ScenePreviewPlate } from "./scene-preview-plate";

/**
 * The tagline is the last beat and it lands well inside the 120-frame window,
 * so the tail was a settled lockup. `holdSeconds` is the corrected recipe —
 * `0.9 * window / fps - 0.79 * exitFor`, 3.6 - 0.33 — which puts the eased
 * midpoint of the retreat on the audit's 90% sample rather than ending before
 * it.
 */
export const LogoRevealPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <LogoReveal
      pathD={DEMO_LOGO_PATH}
      wordmark="Remotion UI"
      tagline="Copy-paste motion components"
      holdSeconds={3.27}
    />
  </ScenePreviewPlate>
);
