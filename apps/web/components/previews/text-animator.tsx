"use client";

import { easyEase, type Animatable } from "../../registry/bases/default/lib/ae-motion";
import {
  TextAnimator,
  type TextAnimatorLayer,
} from "../../registry/bases/default/primitives/text-animator";
import { DEMO_PALETTE } from "@/lib/demo-assets";
import { PREVIEW_UI_FONT, PreviewFrame } from "./preview-frame";
import { usePreviewStage } from "./preview-stage";

/**
 * Four animators, overlapping in time, on a set line — and no per-glyph
 * keyframes anywhere. Each is one or two selectors plus a target:
 *
 * 1. Characters · Smooth range: a wave that lifts, grows and warms each glyph
 *    it passes.
 * 2. Characters · Smooth range ∩ Wiggly: the wiggly selector alone would shake
 *    the whole line; intersected with a travelling range it only exists inside
 *    that window — a tremor band chasing the wave.
 * 3. Lines · Square range on the second line: its tracking breathes and it
 *    turns rose, and the measured layout re-centres it as it widens.
 * 4. Words · Triangle range: whole words lean forward one after another.
 *
 * The clip starts and ends on the set line.
 */
const WAVE: Animatable = [easyEase(4, -0.45), easyEase(66, 1.05)];
const TREMOR_BAND: Animatable = [easyEase(34, -0.4), easyEase(118, 1.05)];
const LINE_BREATH: Animatable = [easyEase(64, 0), easyEase(96, 1), easyEase(140, 0)];
const WORD_LEAN: Animatable = [easyEase(84, -0.55), easyEase(146, 1.05)];

const ANIMATORS: TextAnimatorLayer[] = [
  {
    basedOn: "characters-excluding-spaces",
    properties: { position: [0, -22], scale: 1.12, fill: DEMO_PALETTE.phosphor },
    selectors: [{ shape: "smooth", start: 0, end: 0.45, offset: WAVE }],
  },
  {
    basedOn: "characters-excluding-spaces",
    properties: { position: [0, 26], rotation: 28 },
    selectors: [
      { shape: "smooth", start: 0, end: 0.4, offset: TREMOR_BAND },
      {
        type: "wiggly",
        mode: "intersect",
        minAmount: -1,
        maxAmount: 1,
        wigglesPerSecond: 5,
        correlation: 0.15,
        seed: 3,
      },
    ],
  },
  {
    basedOn: "lines",
    properties: { tracking: 16, fill: DEMO_PALETTE.rose },
    selectors: [{ start: 0.5, end: 1, amount: LINE_BREATH }],
  },
  {
    basedOn: "words",
    properties: { skew: -16, fill: DEMO_PALETTE.teal },
    selectors: [{ shape: "triangle", start: 0, end: 0.55, offset: WORD_LEAN }],
  },
];

export const TextAnimatorPreview: React.FC = () => {
  const tokens = usePreviewStage();
  return (
    <PreviewFrame lane="motion" padding={0}>
      <TextAnimator
        text={"Every letter\nkeeps time"}
        animators={ANIMATORS}
        fontSize={128}
        fontFamily={PREVIEW_UI_FONT}
        fontWeight={800}
        color={tokens.ink}
        letterSpacing={-0.04}
        lineHeight={1.08}
        maxWidth={860}
      />
    </PreviewFrame>
  );
};
