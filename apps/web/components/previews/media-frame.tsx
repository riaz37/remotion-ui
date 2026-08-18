"use client";

import { MediaFrame } from "../registry-exports";
import { DEMO_MEDIA_SRC } from "@/lib/demo-assets";
import { ScenePreviewPlate } from "./scene-preview-plate";

/**
 * The shutter, title and caption are all in by 1s of the 130-frame window and
 * only the slow push runs after, so the frame had no way to leave.
 * `holdSeconds` is the corrected recipe — `0.9 * window / fps - 0.79 *
 * exitFor`, 3.9 - 0.33 — which straddles the audit's 90% sample with the eased
 * midpoint of the retreat.
 */
export const MediaFramePreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <MediaFrame
      src={DEMO_MEDIA_SRC}
      eyebrow="Chapter 02"
      title="Product tour"
      caption="Frame the product in one glance."
      holdSeconds={3.57}
    />
  </ScenePreviewPlate>
);
