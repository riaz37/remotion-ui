"use client";

import { CountdownTimer } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

/**
 * The ring drains continuously and the digit ticks on every whole second, so
 * all three audit samples (frames 18 / 60 / 108) catch a different sweep and a
 * different number. `from={5}` keeps the clock running past the 90% sample
 * rather than resting on zero.
 */
export const CountdownTimerPreview: React.FC = () => (
  <PreviewFrame lane="blocks" padding={0}>
    <CountdownTimer from={5} label="Starting in" zeroLabel="Live" />
  </PreviewFrame>
);
