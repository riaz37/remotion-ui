"use client";

import { AutoFitTitle } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

export const AutoFitTitlePreview: React.FC = () => (
  <PreviewFrame>
    <AutoFitTitle
      title="Headlines that always fit"
      subtitle="Any resolution, any length"
    />
  </PreviewFrame>
);
