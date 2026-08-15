"use client";

import { CandlestickChart } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

/** Deterministic tape: a drift up, a pullback, then a recovery. */
const CANDLES = Array.from({ length: 24 }, (_, index) => {
  const drift = 100 + index * 1.6 + Math.sin(index * 0.55) * 7;
  const open = drift + Math.sin(index * 1.9) * 2.2;
  const close = drift + Math.sin(index * 1.9 + 1.1) * 3.4;
  const spread = 2.4 + Math.abs(Math.sin(index * 0.9)) * 3.2;
  return {
    open,
    close,
    high: Math.max(open, close) + spread,
    low: Math.min(open, close) - spread,
    label: index % 6 === 0 ? `W${index / 6 + 1}` : undefined,
  };
});

/**
 * Samples land at frames 18, 60 and 108. Twenty-four candles on a 3.4-frame
 * stagger print from frame 4 to 94, so the tape is a sixth done at the first
 * sample and two thirds at the second, and the left-to-right clear at 96
 * carries the third.
 */
export const CandlestickChartPreview: React.FC = () => (
  <PreviewFrame lane="signals" padding={72}>
    <CandlestickChart
      candles={CANDLES}
      width={800}
      height={370}
      movingAverage={6}
      delayInFrames={4}
      durationInFrames={12}
      staggerInFrames={3.4}
      exitAtInFrames={96}
    />
  </PreviewFrame>
);
