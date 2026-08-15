"use client";

import { AbsoluteFill } from "remotion";
import { NewsTickerBar } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

/** Stand-in for the broadcast feed above the bar. */
const BroadcastBackdrop: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        "radial-gradient(ellipse at 46% 30%, rgba(249,115,98,0.14), transparent 42%), linear-gradient(180deg, #0d0e14 0%, #16171f 56%, #06070b 100%)",
    }}
  >
    <div
      style={{
        position: "absolute",
        left: "9%",
        top: "16%",
        width: "42%",
        height: 16,
        borderRadius: 999,
        background: "rgba(255,255,255,0.5)",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: "9%",
        top: "27%",
        width: "26%",
        height: 12,
        borderRadius: 999,
        background: "rgba(255,255,255,0.18)",
      }}
    />
  </AbsoluteFill>
);

/**
 * The crawl never stops, so every audit sample lands on a different headline
 * position and no exit is needed. Frames 18 / 60 / 108 differ by roughly a
 * hundred pixels of travel each.
 */
export const NewsTickerBarPreview: React.FC = () => (
  <PreviewFrame lane="blocks" padding={0}>
    <BroadcastBackdrop />
    <NewsTickerBar
      flag="Breaking"
      headlines={[
        "Registry crosses 165 components",
        "CLI adds batch install",
        "Render farm cuts queue times by half",
      ]}
      strapline="Live from the RemotionUI newsroom"
      timestamp="21:04"
    />
  </PreviewFrame>
);
