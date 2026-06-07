"use client";

import { AnimatedBarChart } from "../registry-exports";
import { DEMO_BAR_DATA } from "@/lib/demo-assets";

export const AnimatedBarChartPreview: React.FC = () => (
  <AnimatedBarChart data={DEMO_BAR_DATA} />
);
