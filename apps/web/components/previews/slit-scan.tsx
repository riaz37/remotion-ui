"use client";

import type { ShapeSource } from "../../registry/bases/default/primitives/shape-layer";
import { ShapeLayer } from "../../registry/bases/default/primitives/shape-layer";
import { SlitScan } from "../../registry/bases/default/primitives/slit-scan";
import { DEMO_PALETTE } from "@/lib/demo-assets";
import { PreviewFrame } from "./preview-frame";

/**
 * Three nested stars, turning at different speeds, seen through 120 rings of
 * time.
 *
 * Each ring further from the centre shows the stars a little earlier — up to
 * one second ago at the edge — so their arms curl into a vortex. Every star
 * completes whole turns in the five-second loop, and `loopFrames` lets the
 * outer rings look back past frame 0 into the previous turn, so the first
 * frame is already the vortex and the last hands back to it.
 */
const LOOP = 150;
const SIZE = { width: 960, height: 540 };

const LAYERS: Array<{ star: ShapeSource; turns: number; fill: string }> = [
  {
    star: { type: "star", points: 5, outerRadius: 250, innerRadius: 96, innerRoundness: 0.3 },
    turns: 1,
    fill: DEMO_PALETTE.phosphor,
  },
  {
    star: { type: "star", points: 5, outerRadius: 168, innerRadius: 64, innerRoundness: 0.3 },
    turns: -2,
    fill: DEMO_PALETTE.rose,
  },
  {
    star: { type: "star", points: 5, outerRadius: 92, innerRadius: 36, innerRoundness: 0.3 },
    turns: 3,
    fill: DEMO_PALETTE.teal,
  },
];

/** 36 spokes to the frame edge; through the slit-scan they become spiral arms. */
const SPOKES: ShapeSource[] = [{ type: "path", d: "M60 0 L620 0" }];

const Stars: React.FC = () => (
  <div style={{ display: "grid" }}>
    <div style={{ gridArea: "1 / 1", opacity: 0.55 }}>
      <ShapeLayer
        shapes={SPOKES}
        operators={[
          { op: "repeater", copies: 36, position: [0, 0], rotation: 10, composite: "above" },
          { op: "transform", rotation: ({ frame }) => (frame / LOOP) * 360 },
        ]}
        {...SIZE}
        stroke={DEMO_PALETTE.teal}
        strokeEnd={DEMO_PALETTE.rose}
        strokeWidth={1.4}
      />
    </div>
    {LAYERS.map(({ star, turns, fill }) => (
      <div key={fill} style={{ gridArea: "1 / 1" }}>
        <ShapeLayer
          shapes={[star]}
          operators={[{ op: "transform", rotation: ({ frame }) => (frame / LOOP) * 360 * turns }]}
          {...SIZE}
          stroke={null}
          fill={fill}
        />
      </div>
    ))}
  </div>
);

export const SlitScanPreview: React.FC = () => (
  <PreviewFrame lane="motion" padding={0}>
    <SlitScan {...SIZE} mode="radial" strips={120} levels={120} maxDelay={40} loopFrames={LOOP}>
      <Stars />
    </SlitScan>
  </PreviewFrame>
);
