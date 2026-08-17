"use client";

import { ConnectorLines } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

const WIDTH = 700;
const HEIGHT = 380;

const ANCHORS = [
  { id: "source", x: 0.1, y: 0.5, label: "Source" },
  { id: "parse", x: 0.45, y: 0.16, label: "Parse" },
  { id: "render", x: 0.45, y: 0.84, label: "Render" },
  { id: "output", x: 0.88, y: 0.5, label: "Output" },
];

/**
 * The nodes are the preview's own, positioned at the same fractional anchors
 * the lines use — which is the point of the primitive: it draws the edges and
 * leaves the boxes to you.
 *
 * Four edges draw 14 frames apart, so the last lands on frame 68 and frames
 * 68–95 hold the assembled graph: frame 18 catches the first edge halfway, frame
 * 60 the fourth arriving, and the exit at frame 95 puts frame 108 halfway
 * through the 16-frame exit (cubic-in, so 0.79 of the window). See
 * docs-internal/preview-audit-rubric.md.
 */
export const ConnectorLinesPreview: React.FC = () => (
  <PreviewFrame lane="vectors">
    <div style={{ position: "relative", width: WIDTH, height: HEIGHT }}>
      <ConnectorLines
        width={WIDTH}
        height={HEIGHT}
        strokeWidth={5}
        anchors={ANCHORS}
        delayInFrames={0}
        durationInFrames={26}
        staggerInFrames={14}
        exitAtInFrames={95}
      />
      {ANCHORS.map((anchor) => (
        <div
          key={anchor.id}
          style={{
            position: "absolute",
            left: anchor.x * WIDTH,
            top: anchor.y * HEIGHT,
            transform: "translate(-50%, -50%)",
            padding: "10px 20px",
            borderRadius: 10,
            background: "#0B0C11",
            border: "1px solid rgba(232,184,109,0.45)",
            color: "#D8DCE4",
            fontSize: 24,
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
