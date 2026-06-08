"use client";

import { Sequence } from "remotion";
import { CommentCallout } from "../registry-exports";

export const CommentCalloutPreview: React.FC = () => (
  <Sequence from={-30}>
    <CommentCallout
      author="Mina Lee"
      handle="@minamakes"
      initials="ML"
      body="Can you turn this into a quick video breakdown?"
    />
  </Sequence>
);
