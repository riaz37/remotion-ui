"use client";

import { Audio } from "@remotion/media";
import { AbsoluteFill } from "remotion";
import { VuMeter } from "../registry-exports";
import { DEMO_AUDIO_SRC } from "@/lib/demo-assets";
import { PreviewFrame } from "./preview-frame";

/** Both orientations at once — the meter is small, and the pair shows the
 * segment ramp and the peak marker in the same frame. */
export const VuMeterPreview: React.FC = () => (
  <PreviewFrame lane="signals" padding={0}>
    <AbsoluteFill>
      <Audio src={DEMO_AUDIO_SRC} loop />
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 110,
        }}
      >
        <VuMeter
          src={DEMO_AUDIO_SRC}
          orientation="vertical"
          length={300}
          thickness={30}
          labels={["L", "R"]}
        />
        <VuMeter
          src={DEMO_AUDIO_SRC}
          orientation="horizontal"
          channels={1}
          segments={22}
          length={300}
          thickness={22}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  </PreviewFrame>
);
