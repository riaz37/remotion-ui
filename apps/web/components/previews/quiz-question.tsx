"use client";

import { QuizQuestion } from "../registry-exports";
import { ScenePreviewPlate } from "./scene-preview-plate";

/**
 * Options arrive from 0.55s, the pick lands at 1.75s and the reveal at 2.35s,
 * so frame 18 catches the options arriving, frame 60 (2.0s) the pick settling
 * ahead of the reveal, and `holdSeconds={3.27}` puts frame 108 mid-exit. See
 * docs-internal/preview-audit-rubric.md.
 */
export const QuizQuestionPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <QuizQuestion holdSeconds={3.27} />
  </ScenePreviewPlate>
);
