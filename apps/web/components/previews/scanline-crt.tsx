"use client";

import { AbsoluteFill } from "remotion";
import { ScanlineCrt } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

const BARS = ["#c0c0c0", "#c0c000", "#00c0c0", "#00c000", "#c000c0", "#c00000", "#0000c0"];

/** Test-pattern bars. Vertical edges are what make bowed scanlines visible. */
const TestCard: React.FC = () => (
  <AbsoluteFill>
    <div style={{ display: "flex", width: "100%", height: "78%" }}>
      {BARS.map((color) => (
        <div key={color} style={{ flex: 1, background: color }} />
      ))}
    </div>
    <div
      style={{
        height: "22%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#101010",
        color: "#dcdcdc",
        fontSize: 46,
        fontWeight: 600,
        letterSpacing: 6,
      }}
    >
      SCANLINE CRT
    </div>
  </AbsoluteFill>
);

/**
 * The tube is showing a test card, not the dark preview stage. Every overlay
 * here works by *removing* light — scanlines darken, the grille masks, the
 * vignette shades — so over a near-black plate the component is invisible and
 * the tile shows an empty card. The first cut of this preview did exactly that.
 *
 * The refresh bar rolls in 70 frames, which puts it at 26%, 86% and 54% down
 * the tube at the audit's three samples. On the component's 96-frame default it
 * would be near the top in two of the three. Flicker moves every frame on top.
 */
export const ScanlineCrtPreview: React.FC = () => (
  <PreviewFrame lane="atoms" padding={0}>
    <ScanlineCrt
      rollInFrames={70}
      rollOpacity={0.28}
      curvature={0.7}
      lineCount={64}
      lineOpacity={0.42}
      grille={0.3}
      flicker={0.08}
      vignette={0.6}
    >
      <TestCard />
    </ScanlineCrt>
  </PreviewFrame>
);
