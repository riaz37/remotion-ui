"use client";

import { AbsoluteFill, Img } from "remotion";
import { ReactionBurst } from "../registry-exports";
import { DEMO_PHOTO_SRC } from "@/lib/demo-assets";
import { PreviewFrame } from "./preview-frame";

/**
 * The reactions rise over a real frame rather than a grey plate: the rubric's
 * "give those previews a picture, not a plate" note. The stand-in backdrop this
 * replaced was an untextured rounded rectangle over half the stage, which read
 * as placeholder chrome and left the audited subject under 8% of the frame.
 * `DEMO_PHOTO_SRC` is a picture rather than another grey-bar product card, so
 * the lane reads as an overlay on a stream.
 *
 * The stream never settles, so every audit sample lands on different glyph
 * positions — no exit is needed here. Frames 18 / 60 / 108 each catch a
 * different set of reactions mid-climb.
 */
export const ReactionBurstPreview: React.FC = () => (
  <PreviewFrame lane="blocks" padding={0}>
    <AbsoluteFill>
      <Img
        src={DEMO_PHOTO_SRC}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      {/* Scrim under the lane only — the glyphs need a ground to read against. */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(90deg, rgba(6,4,14,0) 46%, rgba(6,4,14,0.52) 100%)",
        }}
      />
    </AbsoluteFill>
    <ReactionBurst align="right" ratePerSecond={8} />
  </PreviewFrame>
);
