"use client";

import { useCurrentFrame, useVideoConfig } from "remotion";
import {
  easyEase,
  resolveAnimatable,
  type Animatable,
} from "../../registry/bases/default/lib/ae-motion";
import {
  TextAnimator,
  type TextAnimatorLayer,
} from "../../registry/bases/default/primitives/text-animator";
import { DEMO_PALETTE } from "@/lib/demo-assets";
import { PREVIEW_MONO_FONT, PREVIEW_UI_FONT, PreviewFrame } from "./preview-frame";
import { usePreviewStage } from "./preview-stage";

/**
 * Three animators on a set line — no per-glyph keyframes anywhere.
 *
 * - The wave is a Smooth range whose offset is keyframed once: each glyph it
 *   passes lifts, grows and takes the accent, and the selector's shape is what
 *   makes that read as a wave.
 * - The defocus is a Square range with Randomize Order: its end sweeps out and
 *   its start follows, so glyphs soften in a shuffled order and come back in
 *   the same one.
 * - The breath has no selector at all (everything selected) and animates
 *   tracking: the measured layout pushes every neighbour and re-centres each
 *   line as it widens.
 *
 * The clip starts and ends on the set line.
 */
const WAVE_OFFSET: Animatable = [easyEase(4, -0.42), easyEase(68, 1.02)];
const DEFOCUS_END: Animatable = [easyEase(54, 0), easyEase(100, 1)];
const DEFOCUS_START: Animatable = [easyEase(70, 0), easyEase(116, 1)];
const TRACKING: Animatable = [easyEase(92, 0), easyEase(118, 10), easyEase(146, 0)];

const ANIMATORS: TextAnimatorLayer[] = [
  {
    basedOn: "characters-excluding-spaces",
    properties: {
      position: [0, -16],
      scale: 1.1,
      rotation: -6,
      fill: DEMO_PALETTE.phosphor,
    },
    selectors: [{ shape: "smooth", start: 0, end: 0.4, offset: WAVE_OFFSET }],
  },
  {
    basedOn: "characters-excluding-spaces",
    properties: { opacity: 0.5, blur: 4.5, scale: 1.18, fill: DEMO_PALETTE.teal },
    selectors: [
      {
        shape: "square",
        start: DEFOCUS_START,
        end: DEFOCUS_END,
        randomizeOrder: true,
        seed: 7,
      },
    ],
  },
  { properties: { tracking: TRACKING } },
];

const Readout: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tokens = usePreviewStage();
  const at = (value: Animatable) => resolveAnimatable(value, frame, { fps }).toFixed(2);
  const cell = (label: string, detail: string, tone: string) => (
    <span style={{ display: "flex", gap: 10 }}>
      <span style={{ color: tokens.ink }}>{label}</span>
      <span style={{ color: tone, fontVariantNumeric: "tabular-nums" }}>{detail}</span>
    </span>
  );
  return (
    <div
      style={{
        display: "flex",
        gap: 36,
        fontFamily: PREVIEW_MONO_FONT,
        fontSize: 16,
        color: tokens.muted,
      }}
    >
      {cell("Smooth range", `offset ${at(WAVE_OFFSET)}`, DEMO_PALETTE.phosphor)}
      {cell("Random range", `${at(DEFOCUS_START)} → ${at(DEFOCUS_END)}`, DEMO_PALETTE.teal)}
      {cell("Tracking", `${at(TRACKING)} px`, DEMO_PALETTE.rose)}
    </div>
  );
};

export const TextAnimatorPreview: React.FC = () => {
  const tokens = usePreviewStage();
  return (
    <PreviewFrame lane="motion">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 44 }}>
        <TextAnimator
          text={"Every letter keeps\nits own clock"}
          animators={ANIMATORS}
          fontSize={78}
          fontFamily={PREVIEW_UI_FONT}
          fontWeight={700}
          color={tokens.ink}
          letterSpacing={-0.03}
          lineHeight={1.22}
          maxWidth={780}
        />
        <Readout />
      </div>
    </PreviewFrame>
  );
};
