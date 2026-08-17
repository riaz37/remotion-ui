"use client";

import { ArrowAnnotate } from "../registry-exports";
import { PreviewFrame } from "./preview-frame";

const WIDTH = 620;
const HEIGHT = 380;
const TARGET = { x: 0.7, y: 0.74 };

/**
 * The chip is the preview's own DOM: an annotation arrow needs something to
 * annotate, or it points at empty stage.
 *
 * The shaft draws over frames 0–48, so frame 18 is a third of the way along with
 * the label coming up and frame 60 is the landed arrow. The exit starts at frame
 * 97 so frame 108 sits halfway through it — `EASING.exit` is cubic-in, so half
 * the *opacity* is 0.79 of the window, not half of it. See
 * docs-internal/preview-audit-rubric.md.
 */
export const ArrowAnnotatePreview: React.FC = () => (
  <PreviewFrame lane="vectors">
    <div style={{ position: "relative", width: WIDTH, height: HEIGHT }}>
      <ArrowAnnotate
        label="this one"
        labelSize={30}
        to={TARGET}
        width={WIDTH}
        height={HEIGHT}
        strokeWidth={5}
        headSize={26}
        durationInFrames={48}
        exitAtInFrames={97}
      />
      <div
        style={{
          position: "absolute",
          left: TARGET.x * WIDTH + 18,
          top: TARGET.y * HEIGHT,
          transform: "translateY(-50%)",
          padding: "10px 20px",
          borderRadius: 10,
          background: "#0B0C11",
          border: "1px solid rgba(232,184,109,0.45)",
          color: "#D8DCE4",
          fontSize: 28,
          fontWeight: 600,
          whiteSpace: "nowrap",
        }}
      >
        Winner
      </div>
    </div>
  </PreviewFrame>
);
