"use client";

import { TerminalSimulator } from "../registry-exports";
import { ScenePreviewPlate } from "./scene-preview-plate";

/**
 * The prompt returns before the end of the 180-frame window, so the tail was a
 * settled window. `holdSeconds` is the corrected recipe — `0.9 * window / fps -
 * 0.79 * exitFor`, 5.4 - 0.33 — which straddles the audit's 90% sample with the
 * eased midpoint of the retreat.
 */
export const TerminalSimulatorPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <TerminalSimulator holdSeconds={5.07} />
  </ScenePreviewPlate>
);
