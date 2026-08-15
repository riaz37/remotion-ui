"use client";

import { Audio } from "@remotion/media";
import { AbsoluteFill } from "remotion";
import { BeatPulseGrid } from "../registry-exports";
import { DEMO_AUDIO_SRC } from "@/lib/demo-assets";
import { PreviewFrame } from "./preview-frame";

/** Radial mapping, so the kick reads as a pulse travelling out of the centre
 * rather than as a bar meter laid on a grid. */
export const BeatPulseGridPreview: React.FC = () => (
  <PreviewFrame lane="signals" padding={0}>
    <AbsoluteFill>
      <Audio src={DEMO_AUDIO_SRC} loop />
      <AbsoluteFill style={{ display: "grid", placeItems: "center" }}>
        <BeatPulseGrid
          src={DEMO_AUDIO_SRC}
          columns={14}
          rows={7}
          cellSize={38}
          gap={9}
          mapping="radial"
        />
      </AbsoluteFill>
    </AbsoluteFill>
  </PreviewFrame>
);
