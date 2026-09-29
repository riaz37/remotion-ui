"use client";

import { useCurrentFrame, useVideoConfig } from "remotion";
import {
  easyEase,
  resolveAnimatable,
  type Animatable,
} from "../../registry/bases/default/lib/ae-motion";
import {
  ShapeLayer,
  type ShapeOperator,
  type ShapeSource,
} from "../../registry/bases/default/primitives/shape-layer";
import { DEMO_PALETTE } from "@/lib/demo-assets";
import { PREVIEW_MONO_FONT, PreviewFrame } from "./preview-frame";
import { usePreviewStage } from "./preview-stage";

/**
 * One star, four operators. The stack is the subject: Pucker & Bloat breathes
 * the base shape, the Repeater compounds it into a nest that crawls inward,
 * and Trim Paths sitting *below* the repeater treats all 22 copies as one
 * line, so a single stroke of light spirals out through the nest. Put the
 * trim above the repeater and every copy would draw at once instead.
 *
 * The faint layer underneath runs the same stack without the trim — the
 * same operators, reused, not re-authored.
 */
const SHAPES: ShapeSource[] = [
  {
    type: "star",
    points: 5,
    outerRadius: 188,
    innerRadius: 84,
    outerRoundness: 0.15,
    innerRoundness: 0.5,
  },
];

const PUCKER: Animatable = [easyEase(0, -0.2), easyEase(75, 0.28), easyEase(150, -0.2)];
const COPIES = 22;
/** One full step over the clip: the nest crawls inward and lands where it began. */
const REPEAT_OFFSET: Animatable = [
  { frame: 0, value: 0 },
  { frame: 150, value: 1 },
];
const TRIM_OFFSET: Animatable = [
  { frame: 0, value: 0.18 },
  { frame: 150, value: 2.18 },
];

const BASE: ShapeOperator[] = [
  { op: "pucker-bloat", amount: PUCKER },
  {
    op: "repeater",
    copies: COPIES,
    scale: 0.905,
    rotation: 5,
    position: [0, 0],
    offset: REPEAT_OFFSET,
    startOpacity: 1,
    endOpacity: 0.3,
  },
];
const WIGGLE: ShapeOperator = {
  op: "wiggle",
  size: 1.1,
  detail: 3,
  wigglesPerSecond: 1.2,
  correlation: 0.75,
  seed: 4,
};
const GHOST: ShapeOperator[] = [...BASE, WIGGLE];
const LIT: ShapeOperator[] = [
  ...BASE,
  { op: "trim", mode: "individual", start: 0, end: 0.3, offset: TRIM_OFFSET },
  WIGGLE,
];

const SIZE = 500;

/** The layer panel: operator order and live values, as AE's timeline shows them. */
const StackReadout: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tokens = usePreviewStage();
  const value = (animatable: Animatable) => resolveAnimatable(animatable, frame, { fps });
  const rows: Array<[string, string]> = [
    ["Pucker & Bloat", `${value(PUCKER) >= 0 ? "+" : ""}${(value(PUCKER) * 100).toFixed(0)}%`],
    ["Repeater", `${COPIES} × ${value(REPEAT_OFFSET).toFixed(2)}`],
    ["Trim Paths", `30% @ ${value(TRIM_OFFSET).toFixed(2)}`],
    ["Wiggle Paths", "1.1 px"],
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        fontFamily: PREVIEW_MONO_FONT,
        fontSize: 17,
        width: 250,
      }}
    >
      {rows.map(([name, reading], index) => (
        <div key={name} style={{ display: "flex", gap: 14, alignItems: "baseline" }}>
          <span style={{ color: tokens.muted, width: 16 }}>{index + 1}</span>
          <span style={{ color: tokens.ink, flex: 1 }}>{name}</span>
          <span style={{ color: DEMO_PALETTE.phosphor, fontVariantNumeric: "tabular-nums" }}>
            {reading}
          </span>
        </div>
      ))}
    </div>
  );
};

export const ShapeLayerPreview: React.FC = () => (
  <PreviewFrame lane="motion" padding={0}>
    <div style={{ display: "flex", alignItems: "center", gap: 56, marginLeft: 40 }}>
      <StackReadout />
      <div style={{ display: "grid", width: SIZE, height: SIZE }}>
        <div style={{ gridArea: "1 / 1", opacity: 0.16 }}>
          <ShapeLayer
            shapes={SHAPES}
            operators={GHOST}
            width={SIZE}
            height={SIZE}
            stroke={DEMO_PALETTE.phosphor}
            strokeEnd={DEMO_PALETTE.rose}
            strokeWidth={1}
          />
        </div>
        <div style={{ gridArea: "1 / 1" }}>
          <ShapeLayer
            shapes={SHAPES}
            operators={LIT}
            width={SIZE}
            height={SIZE}
            stroke={DEMO_PALETTE.phosphor}
            strokeEnd={DEMO_PALETTE.rose}
            strokeWidth={2}
            glow={4}
          />
        </div>
      </div>
    </div>
  </PreviewFrame>
);
