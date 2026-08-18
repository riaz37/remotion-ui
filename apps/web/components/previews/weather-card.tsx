"use client";

import { WeatherCard } from "../registry-exports";
import { ScenePreviewPlate } from "./scene-preview-plate";

/**
 * The iconography alone does not carry the tail: the forecast glyphs render a
 * few pixels tall, so a turning sun and a falling drop are sub-pixel at tile
 * size and the 50% / 90% samples measured 36.6 dB apart — effectively one
 * image. The card now leaves. `holdSeconds` follows the measured recipe for the
 * cubic exit easing, 0.9 * 120 / 30 - 0.79 * 0.42 = 3.27, which puts the 90%
 * sample mid-exit rather than on a frozen plate.
 *
 * `condition="rain"` for the hero glyph: falling drops at 62u are visible at a
 * 308px tile in a way the sun's ray breathing is not. See
 * docs-internal/preview-audit-rubric.md.
 */
export const WeatherCardPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <WeatherCard
      condition="rain"
      conditionLabel="Showers, easing by six"
      holdSeconds={3.27}
    />
  </ScenePreviewPlate>
);
