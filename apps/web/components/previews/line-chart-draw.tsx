"use client";

import { LineChartDraw } from "../registry-exports";
import { DEMO_LINE_POINTS } from "@/lib/demo-assets";
import { PreviewFrame } from "./preview-frame";

export const LineChartDrawPreview: React.FC = () => (
  <PreviewFrame lane="vectors">
    <LineChartDraw points={DEMO_LINE_POINTS} width={760} height={300} />
  </PreviewFrame>
);
