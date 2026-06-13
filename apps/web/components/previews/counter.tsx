"use client";

import { Counter } from "../registry-exports";
import { MetricPanel, PreviewFrame } from "./preview-frame";

export const CounterPreview: React.FC = () => (
  <PreviewFrame lane="signals">
    <MetricPanel
      label="Render health"
      value={<Counter from={0} to={100} suffix="%" durationInFrames={90} />}
      delta="frames complete"
    />
  </PreviewFrame>
);
