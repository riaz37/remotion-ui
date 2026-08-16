"use client";

import { ConnectorLines } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

const WIDTH = 520;
const HEIGHT = 280;

const ANCHORS = [
  { id: "source", x: 0.12, y: 0.5, label: "Source" },
  { id: "parse", x: 0.44, y: 0.18, label: "Parse" },
  { id: "render", x: 0.44, y: 0.82, label: "Render" },
  { id: "output", x: 0.86, y: 0.5, label: "Output" },
];

/**
 * The nodes are the preview's own, positioned at the same fractional anchors
 * the lines use — which is the point of the primitive: it draws the edges and
 * leaves the boxes to you.
 *
 * Four edges draw 20 frames apart from frame 6, so the diagram is still
 * assembling at frames 18 and 60; the exit at frame 92 covers frame 108. See
 * docs-internal/preview-audit-rubric.md.
 */
export const ConnectorLinesPreview: React.FC = () => (
  <PreviewFrame lane="vectors">
    <div style={{ position: "relative", width: WIDTH, height: HEIGHT }}>
      <ConnectorLines
        width={WIDTH}
        height={HEIGHT}
        strokeWidth={3}
        anchors={ANCHORS}
        delayInFrames={6}
        durationInFrames={30}
        staggerInFrames={20}
        exitAtInFrames={92}
      />
      {ANCHORS.map((anchor) => (
        <div
          key={anchor.id}
          style={{
            position: "absolute",
            left: anchor.x * WIDTH,
            top: anchor.y * HEIGHT,
            transform: "translate(-50%, -50%)",
            padding: "8px 14px",
            borderRadius: 10,
            background: "#0B0C11",
            border: "1px solid rgba(232,184,109,0.45)",
            color: "#D8DCE4",
            fontSize: 15,
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          {anchor.label}
        </div>
      ))}
    </div>
  </PreviewFrame>
);
