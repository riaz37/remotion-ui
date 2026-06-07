"use client";

import { CodeReveal } from "../registry-exports";

export const CodeRevealPreview: React.FC = () => (
  <CodeReveal
    code={`import { MediaFrame } from "@/remotion/scenes/media-frame";

<MediaFrame
  src={staticFile("demo.png")}
  title="Product demo"
/>`}
    highlightedLines={[3, 4]}
  />
);
