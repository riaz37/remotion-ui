"use client";

import { AbsoluteFill } from "remotion";
import { SportsScorebug } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

/** Stand-in for the broadcast feed under the bug. */
const BroadcastBackdrop: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        "radial-gradient(ellipse at 50% 78%, rgba(125,211,232,0.14), transparent 44%), linear-gradient(180deg, #0a1016 0%, #101a1e 58%, #060a0d 100%)",
    }}
  >
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: "38%",
        background:
          "linear-gradient(180deg, transparent, rgba(125,211,232,0.07) 60%, rgba(0,0,0,0.35))",
      }}
    />
  </AbsoluteFill>
);

/**
 * The clock runs the whole window, a basket lands at 1.1s and another at 2.6s
 * so the 15% and 50% samples catch a flashing side, and `holdSeconds={3.4}`
 * puts the 90% sample mid-exit. See docs-internal/preview-audit-rubric.md.
 */
export const SportsScorebugPreview: React.FC = () => (
  <PreviewFrame lane="blocks" padding={0}>
    <BroadcastBackdrop />
    <SportsScorebug
      away={{ abbr: "NOR", score: 66, color: "#7DD3E8" }}
      home={{ abbr: "VAL", score: 71, color: "#E8B86D", possession: true }}
      period="Q4"
      clockSeconds={154}
      changes={[
        { side: "away", atSeconds: 1.1, points: 3 },
        { side: "home", atSeconds: 2.6, points: 2 },
      ]}
      holdSeconds={3.4}
    />
  </PreviewFrame>
);
