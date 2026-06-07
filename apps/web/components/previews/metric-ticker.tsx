"use client";

import { MetricTicker } from "../registry-exports";

export const MetricTickerPreview: React.FC = () => (
  <MetricTicker
    metrics={[
      { label: "Views", value: 124000, delta: "+32%" },
      { label: "Watch time", value: 8600, suffix: "h", delta: "+18%" },
      { label: "Clips", value: 42, delta: "+7" },
    ]}
  />
);
