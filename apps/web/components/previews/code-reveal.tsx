"use client";

import { CodeReveal } from "../registry-exports";

export const CodeRevealPreview: React.FC = () => (
  <CodeReveal
    title="Callout recipe"
    code={`import { CalloutSpotlight } from "@/remotion/scenes/callout-spotlight";

<CalloutSpotlight
  title="Explain the action"
  target={{ x: 520, y: 260, width: 420, height: 220 }}
/>`}
    highlightedLines={[3, 4]}
  />
);
