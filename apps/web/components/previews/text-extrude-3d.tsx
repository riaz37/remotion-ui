"use client";

import { staticFile } from "remotion";
import { TextExtrude3d } from "../../registry/bases/default/scenes/text-extrude-3d";
import { PreviewFrame } from "./preview-frame";

/**
 * The scene owns the whole frame (backdrop, floor pool, lights), so the frame
 * adds no padding.
 *
 * Audit samples on the 150-frame window: 22 (letters still tumbling up, camera
 * low and close), 75 (line settled, camera mid pull-back) and 135 (pulled back
 * on the full headline, still drifting): three different shots.
 */
export const TextExtrude3dPreview: React.FC = () => (
  <PreviewFrame lane="3d" padding={0}>
    <TextExtrude3d fontUrl={staticFile("fonts/geist-bold.typeface.json")} />
  </PreviewFrame>
);
