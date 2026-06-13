"use client";

import { KaraokeCaptions } from "../registry-exports";
import { DEMO_CAPTIONS } from "@/lib/demo-assets";
import { groupCaptionsIntoPages } from "@/remotion/lib/caption-utils";
import { PreviewFrame } from "./preview-frame";

const [page] = groupCaptionsIntoPages(DEMO_CAPTIONS, 2200);

export const KaraokeCaptionsPreview: React.FC = () => (
  <PreviewFrame lane="signals">
    {page ? <KaraokeCaptions page={page} /> : null}
  </PreviewFrame>
);
