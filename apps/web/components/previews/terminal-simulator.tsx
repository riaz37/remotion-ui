"use client";

import { TerminalSimulator } from "../registry-exports";
import { ScenePreviewPlate } from "./scene-preview-plate";

/**
 * The prompt returns before the end of the 180-frame window, so the tail was a
 * settled window. `holdSeconds` is the corrected recipe — `0.9 * window / fps -
 * 0.79 * exitFor`, 5.4 - 0.33 — which straddles the audit's 90% sample with the
 * eased midpoint of the retreat.
 *
 * D1. `zoom` exists for exactly this: the window is laid out against a 1280x720
 * reference, which puts the 21-unit log type under 5px once the 960 stage is
 * reduced to a 308px contact-sheet tile. 1.18 fills the room the window was
 * leaving empty and carries the log with it.
 */
export const TerminalSimulatorPreview: React.FC = () => (
  <ScenePreviewPlate direct>
    <TerminalSimulator holdSeconds={5.07} zoom={1.18} />
  </ScenePreviewPlate>
);
