"use client";

import { Counter } from "../registry-exports";
import { DEMO_METRICS } from "@/lib/demo-assets";
import { MetricPanel, PreviewFrame } from "./preview-frame";

const views = DEMO_METRICS[0];

export const CounterPreview: React.FC = () => (
  <PreviewFrame lane="signals">
    <MetricPanel
      label={views.label}
      value={
        <Counter
          from={0}
          to={views.value}
          roll
          delayInFrames={8}
          durationInFrames={64}
          fontSize={92}
          fontWeight={600}
        />
      }
      delta={`${views.delta} on last quarter`}
    />
  </PreviewFrame>
);
