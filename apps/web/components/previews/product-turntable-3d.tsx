"use client";

import { ProductTurntable3d } from "../../registry/bases/default/scenes/product-turntable-3d";
import { PreviewFrame } from "./preview-frame";

/**
 * The scene owns the whole frame (backdrop, floor pool, lights), so the frame
 * adds no padding. No `src` is passed on purpose: the catalog preview is the
 * zero-asset path, which is what most people see first.
 *
 * Audit samples on the 150-frame window: 22 (still settling onto the platter,
 * label front-on), 75 (half a turn, barcode face toward camera) and 135 (turn
 * closing, camera pushed in). Three different shots, and the turn is linear
 * across the window so the last frame is still moving.
 */
export const ProductTurntable3dPreview: React.FC = () => (
  <PreviewFrame lane="3d" padding={0}>
    <ProductTurntable3d />
  </PreviewFrame>
);
