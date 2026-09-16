"use client";

import { staticFile } from "remotion";
import { DeviceMockup3D } from "../../registry/bases/default/scenes/device-mockup-3d";
import { PreviewFrame } from "./preview-frame";

/**
 * The scene owns the whole frame (backdrop, floor, lights), so the frame adds
 * no padding. The site ships the launch-film still, so the preview reads it
 * locally rather than over the network the registry default uses.
 *
 * Audit samples on the 150-frame window: 22 (lid half open, still settling),
 * 75 (mid-turn) and 135 (pushed in, still drifting) — three different shots.
 */
export const DeviceMockup3DPreview: React.FC = () => (
  <PreviewFrame lane="3d" padding={0}>
    <DeviceMockup3D src={staticFile("launch-film/04-preview-ready.png")} />
  </PreviewFrame>
);
