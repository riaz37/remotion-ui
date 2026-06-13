"use client";

import { WordHighlight } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

export const WordHighlightPreview: React.FC = () => (
  <PreviewFrame lane="atoms" padding={96}>
    <WordHighlight
      text="Make the key word memorable"
      highlightWord="memorable"
      durationInFrames={45}
      highlightColor="#a5b4fc"
    />
  </PreviewFrame>
);
