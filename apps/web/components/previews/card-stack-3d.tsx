"use client";

import { CardStack3d } from "../../registry/bases/default/scenes/card-stack-3d";
import { PreviewFrame } from "./preview-frame";

/**
 * The scene owns the whole frame (backdrop, floor, lights), so the frame adds
 * no padding.
 *
 * Audit samples at 15% / 50% / 90% of the 120-frame window — frames 18, 60 and
 * 108. At 18 the deck is mid-fan and still edge-on, at 60 the cards are turning
 * to face the camera, and at 108 the camera is pushed in while the linear deck
 * yaw and the sine bob keep the tail moving.
 */
export const CardStack3dPreview: React.FC = () => (
  <PreviewFrame lane="3d" padding={0}>
    <CardStack3d />
  </PreviewFrame>
);
