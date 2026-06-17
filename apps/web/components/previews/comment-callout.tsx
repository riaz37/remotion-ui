"use client";

import { Sequence } from "remotion";
import { CommentCallout } from "../registry-exports";
import { DEMO_COPY } from "@/lib/demo-assets";
import { ScenePreviewPlate } from "./scene-preview-plate";

export const CommentCalloutPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <Sequence from={0}>
      <CommentCallout
        author={DEMO_COPY.creatorComment.author}
        handle={DEMO_COPY.creatorComment.handle}
        initials="AC"
        body={DEMO_COPY.creatorComment.body}
      />
    </Sequence>
  </ScenePreviewPlate>
);
