"use client";

import { CalendarMonthFill } from "../registry-exports";
import { ScenePreviewPlate } from "./scene-preview-plate";

/**
 * Events drop every 0.2s from 0.95s and the last lands at ~2.45s, so frame 18
 * catches the grid sweeping up, frame 60 (2.0s) the month still filling, and
 * `holdSeconds={3.4}` puts frame 108 mid-exit. See
 * docs-internal/preview-audit-rubric.md.
 */
export const CalendarMonthFillPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <CalendarMonthFill holdSeconds={3.4} />
  </ScenePreviewPlate>
);
