"use client";

import { Sequence } from "remotion";
import { DataStory } from "../registry-exports";
import { DEMO_BAR_DATA } from "@/lib/demo-assets";

export const DataStoryPreview: React.FC = () => (
  <Sequence from={-72}>
    <DataStory
      title="Creator growth"
      subtitle="Turn weekly numbers into a video story"
      barData={DEMO_BAR_DATA}
      metrics={[
        { label: "Reach", value: 124000, delta: "+32%" },
        { label: "Retention", value: 68, suffix: "%", delta: "+11%" },
        { label: "Exports", value: 42, delta: "+7" },
      ]}
      steps={[
        { title: "Collect", description: "Gather the signal." },
        { title: "Compare", description: "Show the delta." },
        { title: "Explain", description: "Name the insight." },
      ]}
      insight="The clearest trend gets the most screen time."
      ctaTitle="Data Cut"
      ctaLabel="Build the next insight"
    />
  </Sequence>
);
