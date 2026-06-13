"use client";

import { LogoReveal } from "../registry-exports";
import { DEMO_LOGO_PATH } from "@/lib/demo-assets";
import { PreviewFrame } from "./preview-frame";

export const LogoRevealPreview: React.FC = () => (
  <PreviewFrame lane="vectors">
    <LogoReveal
      pathD={DEMO_LOGO_PATH}
      width={220}
      height={220}
      viewBox="0 0 200 200"
      stroke="#60a5fa"
    />
  </PreviewFrame>
);
