"use client";

import type { Vec2 } from "../../registry/bases/default/lib/ae-motion";
import {
  EffectorField,
  type CloneRenderState,
  type Effector,
} from "../../registry/bases/default/primitives/effector-field";
import { DEMO_PALETTE } from "@/lib/demo-assets";
import { PreviewFrame } from "./preview-frame";
import { usePreviewStage } from "./preview-stage";

/**
 * A MoGraph floor: one grid cloner, three effectors.
 *
 * Two spherical fields ride Lissajous paths written as expressions (the third
 * state an `Animatable` can take, after static and keyframed). Their period is
 * exactly the clip length, so the last frame hands back to the first. Where a
 * field passes, tiles lift toward the camera, stand up and take the field's
 * colour; where the two overlap the tints mix. A slow noise field underneath
 * dims and shrinks tiles so the floor never reads as a flat grid.
 */
const LOOP_SECONDS = 5;
const orbit =
  (rx: number, ry: number, phase: number, lobes: number) =>
  ({ time }: { time: number }): Vec2 => {
    const a = (time / LOOP_SECONDS) * Math.PI * 2 + phase;
    return [Math.cos(a) * rx, Math.sin(a * lobes) * ry];
  };

const EFFECTORS: Effector[] = [
  {
    fields: [{ shape: "noise", scale: 150, speed: 0.3, seed: 5, contrast: 1.6 }],
    opacity: 0.22,
    scale: 0.55,
  },
  {
    fields: [
      { shape: "spherical", center: orbit(270, 150, 0, 2), radius: 200, falloff: 0.9 },
    ],
    position: [0, 0, 170],
    rotation: [-75, 0, 0],
    scale: 1.5,
    color: DEMO_PALETTE.phosphor,
  },
  {
    fields: [
      { shape: "spherical", center: orbit(250, 140, Math.PI, 2), radius: 160, falloff: 0.9 },
    ],
    position: [0, 0, 110],
    rotation: [-60, 0, 0],
    scale: 1.3,
    color: DEMO_PALETTE.teal,
  },
];

const LAYOUT = { mode: "grid", columns: 36, rows: 20, spacing: 22 } as const;

/**
 * A custom clone: the tile glows in its own tint, as hard as the fields push
 * it, so the crests read as light rather than as paint.
 */
const GlowTile = (clone: CloneRenderState) => (
  <div
    style={{
      width: "100%",
      height: "100%",
      borderRadius: 2,
      background: clone.color,
      boxShadow: clone.weight > 0.05 ? `0 0 ${Math.round(16 * clone.weight)}px ${clone.color}` : undefined,
    }}
  />
);

export const EffectorFieldPreview: React.FC = () => {
  const tokens = usePreviewStage();
  return (
    <PreviewFrame lane="motion" padding={0}>
      <EffectorField
        layout={LAYOUT}
        effectors={EFFECTORS}
        width={960}
        height={540}
        cloneSize={9}
        color={tokens.muted}
        tilt={50}
        perspective={1000}
        renderClone={GlowTile}
        style={{ marginTop: 60 }}
      />
    </PreviewFrame>
  );
};
