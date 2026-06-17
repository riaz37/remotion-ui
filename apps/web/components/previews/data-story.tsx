"use client";

import { Sequence } from "remotion";
import { DataStory } from "../registry-exports";
import {
  DEMO_BAR_DATA,
  DEMO_COPY,
  DEMO_METRICS,
  DEMO_TIMELINE_STEPS,
} from "@/lib/demo-assets";

export const DataStoryPreview: React.FC = () => (
  <Sequence from={0}>
    <DataStory
      title={DEMO_COPY.dataStory.title}
      subtitle={DEMO_COPY.dataStory.subtitle}
      chartTitle={DEMO_COPY.dataStory.chartTitle}
      metricsTitle={DEMO_COPY.dataStory.metricsTitle}
      timelineTitle={DEMO_COPY.dataStory.timelineTitle}
      barData={DEMO_BAR_DATA}
      metrics={DEMO_METRICS}
      steps={DEMO_TIMELINE_STEPS}
      insight={DEMO_COPY.quote.text}
      insightEyebrow={DEMO_COPY.dataStory.insightEyebrow}
      ctaTitle={DEMO_COPY.dataStory.ctaTitle}
      ctaLabel={DEMO_COPY.endCard.ctaLabel}
    />
  </Sequence>
);
