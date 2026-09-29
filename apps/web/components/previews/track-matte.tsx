"use client";

import { interpolate, staticFile, useCurrentFrame } from "remotion";
import type { Vec2 } from "../../registry/bases/default/lib/ae-motion";
import { EffectorField, type Effector } from "../../registry/bases/default/primitives/effector-field";
import { MatteVideo, TrackMatte } from "../../registry/bases/default/primitives/track-matte";
import { DEMO_PALETTE } from "@/lib/demo-assets";
import { PREVIEW_UI_FONT, PreviewFrame } from "./preview-frame";

/**
 * Two track mattes, running in opposite directions.
 *
 * Behind: footage *as* the matte. A luma matte made of flight footage reveals
 * a slowly turning gradient, so the map's own roads, coastlines and labels
 * glow in colour and everything dark stays black.
 *
 * In front: type as the matte for another scene. An alpha matte of the
 * headline reveals the lane's glowing MoGraph floor, so the letters are
 * windows onto a moving 3D field.
 */
const SIZE = { width: 960, height: 540 };
const FOOTAGE = staticFile("showcases/map-flight.mp4");
const LOOP = 150;

const Gradient: React.FC = () => {
  const frame = useCurrentFrame();
  const angle = interpolate(frame, [0, LOOP], [20, 200], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        ...SIZE,
        background: `linear-gradient(${angle}deg, ${DEMO_PALETTE.phosphor}, ${DEMO_PALETTE.rose} 50%, ${DEMO_PALETTE.teal})`,
      }}
    />
  );
};

const orbit =
  (phase: number) =>
  ({ time }: { time: number }): Vec2 => {
    const a = (time / 5) * Math.PI * 2 + phase;
    return [Math.cos(a) * 300, Math.sin(a * 2) * 130];
  };
const FLOOR: Effector[] = [
  {
    fields: [{ shape: "spherical", center: orbit(0), radius: 240, falloff: 0.9 }],
    position: [0, 0, 150],
    scale: 1.6,
    color: DEMO_PALETTE.phosphor,
  },
  {
    fields: [{ shape: "spherical", center: orbit(Math.PI), radius: 200, falloff: 0.9 }],
    position: [0, 0, 110],
    scale: 1.4,
    color: DEMO_PALETTE.teal,
  },
];

const Headline: React.FC = () => (
  <text
    x={SIZE.width / 2}
    y={SIZE.height / 2 + 78}
    textAnchor="middle"
    fontFamily={PREVIEW_UI_FONT}
    fontWeight={800}
    fontSize={232}
    letterSpacing={-6}
    fill="white"
  >
    MATTE
  </text>
);

export const TrackMattePreview: React.FC = () => (
  <PreviewFrame lane="motion" padding={0}>
    <div style={{ position: "absolute", inset: 0 }}>
      <TrackMatte {...SIZE} mode="luma" matte={<MatteVideo src={FOOTAGE} />}>
        <Gradient />
      </TrackMatte>
    </div>
    <div style={{ position: "absolute", inset: 0 }}>
      <TrackMatte {...SIZE} mode="alpha" matte={<Headline />}>
        <div style={{ ...SIZE, background: "#07070c" }}>
          <EffectorField
            layout={{ mode: "grid", columns: 64, rows: 28, spacing: 15 }}
            effectors={FLOOR}
            {...SIZE}
            cloneSize={7}
            color="#5b5b66"
            tilt={48}
            perspective={1000}
            renderer="canvas"
            glow={8}
          />
        </div>
      </TrackMatte>
    </div>
  </PreviewFrame>
);
