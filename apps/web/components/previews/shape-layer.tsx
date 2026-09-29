"use client";

import { easyEase, type Animatable } from "../../registry/bases/default/lib/ae-motion";
import {
  ShapeLayer,
  type ShapeOperator,
  type ShapeSource,
} from "../../registry/bases/default/primitives/shape-layer";
import { DEMO_PALETTE } from "@/lib/demo-assets";
import { PreviewFrame } from "./preview-frame";

/**
 * One star, three layers, one stack of operators reused between them.
 *
 * - Behind: the star through Offset Paths with nine copies. Its copy offset
 *   loops once over the clip, so contour rings ripple out past the frame
 *   edges and the last frame hands back to the first.
 * - Middle: the same star through Pucker & Bloat and a compounding Repeater —
 *   a nest of 22 copies that crawls inward, left faint.
 * - Front: the same nest with Trim Paths *below* the Repeater, so the trim
 *   treats all 22 copies as one line and a single stroke of light spirals out
 *   through them. Above the repeater, every copy would draw at once instead.
 */
const SIZE = { width: 960, height: 540 };
const LOOP = 150;

const STAR: ShapeSource[] = [
  {
    type: "star",
    points: 5,
    outerRadius: 215,
    innerRadius: 98,
    outerRoundness: 0.15,
    innerRoundness: 0.5,
  },
];

const PUCKER: Animatable = [easyEase(0, -0.2), easyEase(LOOP / 2, 0.28), easyEase(LOOP, -0.2)];
const ONE_STEP: Animatable = [
  { frame: 0, value: 0 },
  { frame: LOOP, value: 1 },
];

const NEST: ShapeOperator[] = [
  { op: "pucker-bloat", amount: PUCKER },
  {
    op: "repeater",
    copies: 22,
    scale: 0.905,
    rotation: 5,
    position: [0, 0],
    offset: ONE_STEP,
    startOpacity: 1,
    endOpacity: 0.3,
  },
];
const TREMOR: ShapeOperator = {
  op: "wiggle",
  size: 1.1,
  detail: 3,
  wigglesPerSecond: 1.2,
  correlation: 0.75,
  seed: 4,
};

/**
 * The ripples offset a rounded pentagon, not the star: offsetting the looped,
 * bloated star at these distances ties itself in knots (as it would in AE).
 * A convex source offsets cleanly at any distance.
 */
const PENTAGON: ShapeSource[] = [{ type: "polygon", points: 5, radius: 110, roundness: 0.3 }];
const RIPPLES: ShapeOperator[] = [
  { op: "offset", amount: 42, copies: 10, copyOffset: ONE_STEP, join: "round" },
];
const GHOST: ShapeOperator[] = [...NEST, TREMOR];
const LIT: ShapeOperator[] = [
  ...NEST,
  {
    op: "trim",
    mode: "individual",
    start: 0,
    end: 0.3,
    offset: [
      { frame: 0, value: 0.18 },
      { frame: LOOP, value: 2.18 },
    ],
  },
  TREMOR,
];

const Layer: React.FC<{ opacity?: number; children: React.ReactNode }> = ({ opacity = 1, children }) => (
  <div style={{ gridArea: "1 / 1", opacity }}>{children}</div>
);

export const ShapeLayerPreview: React.FC = () => (
  <PreviewFrame lane="motion" padding={0}>
    <div style={{ display: "grid", ...SIZE }}>
      <Layer opacity={0.32}>
        <ShapeLayer
          shapes={PENTAGON}
          operators={RIPPLES}
          {...SIZE}
          stroke={DEMO_PALETTE.rose}
          strokeEnd={DEMO_PALETTE.phosphor}
          strokeWidth={1.3}
        />
      </Layer>
      <Layer opacity={0.3}>
        <ShapeLayer
          shapes={STAR}
          operators={GHOST}
          {...SIZE}
          stroke={DEMO_PALETTE.phosphor}
          strokeEnd={DEMO_PALETTE.rose}
          strokeWidth={1}
        />
      </Layer>
      <Layer>
        <ShapeLayer
          shapes={STAR}
          operators={LIT}
          {...SIZE}
          stroke={DEMO_PALETTE.phosphor}
          strokeEnd={DEMO_PALETTE.rose}
          strokeWidth={2.2}
          glow={5}
        />
      </Layer>
    </div>
  </PreviewFrame>
);
