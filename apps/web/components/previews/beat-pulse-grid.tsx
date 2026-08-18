"use client";

import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { BeatPulseGrid } from "../registry-exports";
import { DEMO_AUDIO_SRC } from "@/lib/demo-assets";
import { PreviewFrame } from "./preview-frame";

/** Radial mapping, so the kick reads as a pulse travelling out of the centre
 * rather than as a bar meter laid on a grid. */
export const BeatPulseGridPreview: React.FC = () => {
  const { fps } = useVideoConfig();

  return (
    <PreviewFrame lane="signals" padding={0}>
      <AbsoluteFill>
        {/* Doc rules 14 and 34. `premountFor` mounts the tag a second early so the
          decoder is warm before the first visible frame, and
          `pauseWhenBuffering` — which lives on the HTML5 fallback props, the
          path that can actually stall — holds the Player on a slow source
          instead of running silence under a live meter. */}
        <Sequence from={0} premountFor={fps}>
          <Audio
            src={DEMO_AUDIO_SRC}
            loop
            fallbackHtml5AudioProps={{ pauseWhenBuffering: true }}
          />
        </Sequence>
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
};
