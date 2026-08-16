"use client";

import { WeatherCard } from "../registry-exports";
import { ScenePreviewPlate } from "./scene-preview-plate";

/**
 * No exit is scheduled and none is needed: the rays turn, the clouds drift and
 * the drops fall on their own loops, so frames 18 / 60 / 108 differ even after
 * the temperature has finished counting. See
 * docs-internal/preview-audit-rubric.md.
 */
export const WeatherCardPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <WeatherCard />
  </ScenePreviewPlate>
);
