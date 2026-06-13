"use client";

import { useMemo } from "react";
import { CaptionHighlight } from "../registry-exports";
import { DEMO_CAPTIONS } from "@/lib/demo-assets";
import { groupCaptionsIntoPages } from "../../registry/bases/default/lib/caption-utils";
import { PreviewFrame } from "./preview-frame";

export const CaptionHighlightPreview: React.FC = () => {
  const pages = useMemo(() => groupCaptionsIntoPages(DEMO_CAPTIONS), []);
  const page = pages[0];

  if (!page) return null;

  return (
    <PreviewFrame lane="signals">
      <CaptionHighlight page={page} />
    </PreviewFrame>
  );
};
