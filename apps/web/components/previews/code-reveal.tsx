"use client";

import { CodeReveal } from "../registry-exports";
import { ScenePreviewPlate } from "./scene-preview-plate";

export const CodeRevealPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <CodeReveal
      code={`import { CalloutSpotlight } from "@/remotion/scenes/callout-spotlight";

<CalloutSpotlight
  title="Explain the action"
  target={{ x: 520, y: 260, width: 420, height: 220 }}
/>`}
      highlightedLines={[3, 4]}
    />
  </ScenePreviewPlate>
);
