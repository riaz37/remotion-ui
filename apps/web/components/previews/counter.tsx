"use client";

import { Counter } from "../registry-exports";
import { DEMO_COPY, DEMO_METRICS } from "@/lib/demo-assets";
import { MetricPanel, PreviewFrame } from "./preview-frame";

export const CounterPreview: React.FC = () => (
  <PreviewFrame lane="signals">
    <MetricPanel
      label={DEMO_COPY.dataStory.statLabel}
      value={
        <Counter
          from={0}
          to={DEMO_COPY.dataStory.statValue}
          suffix={DEMO_COPY.dataStory.statSuffix}
          delayInFrames={10}
          durationInFrames={60}
        />
      }
      delta={DEMO_METRICS[0].delta}
    />
  </PreviewFrame>
);
