"use client";

import { CodeReveal } from "../../registry/bases/default/scenes/code-reveal";
import { ScenePreviewPlate } from "./scene-preview-plate";

export const CodeRevealPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <CodeReveal
      title="explainer.tsx"
      code={`import { CalloutSpotlight } from "@/remotion/scenes";

export const Explainer = () => (
  <CalloutSpotlight
    title="Explain the action"
    target={{ x: 520, y: 260 }}
  />
);`}
      highlightedLines={[4, 5, 6]}
    />
  </ScenePreviewPlate>
);
