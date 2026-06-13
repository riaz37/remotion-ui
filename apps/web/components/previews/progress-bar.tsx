"use client";

import { ProgressBar } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

export const ProgressBarPreview: React.FC = () => (
  <PreviewFrame lane="atoms" padding={96}>
    <div style={{ width: 680 }}>
      <ProgressBar
        progress={1}
        durationInFrames={60}
        label="Exporting launch cut"
        color="#a5b4fc"
      />
    </div>
  </PreviewFrame>
);
