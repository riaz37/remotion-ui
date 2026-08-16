"use client";

import { BlobMorph } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

/**
 * No entrance and no exit: the blob travels its ring of shapes on a 96-frame
 * period, so frames 18 / 60 / 108 all land on different geometry. See
 * docs-internal/preview-audit-rubric.md.
 */
export const BlobMorphPreview: React.FC = () => (
  <PreviewFrame lane="vectors">
    <BlobMorph size={320} periodInFrames={96} />
  </PreviewFrame>
);
