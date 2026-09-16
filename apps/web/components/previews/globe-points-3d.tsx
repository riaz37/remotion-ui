"use client";

import { GlobePoints3d } from "../../registry/bases/default/scenes/globe-points-3d";
import { PreviewFrame } from "./preview-frame";

/**
 * The scene owns the whole frame (backdrop, starfield, lights), so the frame
 * adds no padding.
 *
 * The audit samples at 15% / 50% / 90% of the window. On the 150-frame render
 * that is 22 (continents still knitting in, first arcs launching), 75 (pins up,
 * arcs mid-flight) and 135 (globe turned well past the start, arcs on their
 * second pass): three different shots. The spin and the camera drift never
 * settle, so the last frame is still moving.
 */
export const GlobePoints3dPreview: React.FC = () => (
  <PreviewFrame lane="3d" padding={0}>
    <GlobePoints3d />
  </PreviewFrame>
);
