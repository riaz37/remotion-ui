"use client";

import { Typewriter } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

export const TypewriterPreview: React.FC = () => (
  <PreviewFrame lane="atoms" padding={96}>
    <Typewriter
      text="Describe the scene. Render the video."
      pauseAfter="Describe the scene."
      charFrames={2}
      pauseSeconds={0.8}
    />
  </PreviewFrame>
);
