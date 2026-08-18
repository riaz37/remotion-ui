"use client";

import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { VuMeter } from "../registry-exports";
import { DEMO_AUDIO_SRC } from "@/lib/demo-assets";
import { PreviewFrame } from "./preview-frame";

/**
 * A meter is an instrument, and an instrument reads from its chrome. Two bare
 * strips floating in a 960x540 stage left roughly 80% of the frame empty and
 * nothing on screen saying "meter"; the console plate, the dB ticks and the
 * bus captions are what make the segments mean something at 308px.
 *
 * `sensitivity` is lifted because the demo track sits around a third of full
 * scale, so the amber and pink zones — a third of the component's prop surface
 * — never lit. 1.3 is as far as it goes: at 1.8 the loud passages pinned every
 * segment, and a meter reading full scale on two of three samples is as dead as
 * one reading a tenth.
 */
const METER_LENGTH = 372;
const BAR_LENGTH = 452;
const SENSITIVITY = 1.3;

const RULE = "rgba(250,250,250,0.16)";
const CHROME = "rgba(250,250,250,0.52)";
const FAINT = "rgba(250,250,250,0.34)";

/** Where a dB mark falls on a linear 0-1 scale: 10^(dB/20). */
const TICKS = [
  { label: "0", at: 1 },
  { label: "-3", at: 0.71 },
  { label: "-10", at: 0.32 },
  { label: "-20", at: 0.1 },
];

const tickTextStyle = {
  fontSize: 20,
  fontWeight: 600,
  letterSpacing: "0.04em",
  fontVariantNumeric: "tabular-nums" as const,
  color: CHROME,
};

const captionStyle = {
  fontSize: 22,
  fontWeight: 700,
  letterSpacing: "0.14em",
  color: FAINT,
};

const VerticalScale: React.FC = () => (
  <div style={{ position: "relative", width: 74, height: METER_LENGTH }}>
    {TICKS.map((tick) => (
      <div
        key={tick.label}
        style={{
          position: "absolute",
          right: 0,
          bottom: tick.at * METER_LENGTH - 13,
          display: "flex",
          alignItems: "center",
          gap: 10,
          height: 26,
        }}
      >
        <span style={tickTextStyle}>{tick.label}</span>
        <div style={{ width: 14, height: 2, background: RULE }} />
      </div>
    ))}
  </div>
);

const HorizontalScale: React.FC = () => (
  <div style={{ position: "relative", width: BAR_LENGTH, height: 30 }}>
    {TICKS.map((tick) => (
      <div
        key={tick.label}
        style={{
          position: "absolute",
          left: tick.at * BAR_LENGTH,
          translate: "-50% 0",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 5,
        }}
      >
        <div style={{ width: 2, height: 9, background: RULE }} />
        <span style={tickTextStyle}>{tick.label}</span>
      </div>
    ))}
  </div>
);

export const VuMeterPreview: React.FC = () => {
  const { fps } = useVideoConfig();

  return (
    <PreviewFrame lane="signals" padding={0}>
      <AbsoluteFill
        style={{ alignItems: "center", justifyContent: "center" }}
      >
        {/* `premountFor` mounts the audio a second ahead of its first frame so
            the decoder is warm before the meter needs it, and
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

        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            gap: 40,
            padding: "30px 38px 34px",
            borderRadius: 24,
            border: `1px solid ${RULE}`,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.012))",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <span style={captionStyle}>STEREO BUS</span>
            {/* Top-aligned, not bottom: `VuMeter` stacks its channel captions
                *below* the segment column, so bottom-aligning the dB scale
                against the whole block pushed every tick down by the height of
                the `L` / `R` row. Both are exactly `METER_LENGTH` from the top. */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <VerticalScale />
              <VuMeter
                src={DEMO_AUDIO_SRC}
                orientation="vertical"
                length={METER_LENGTH}
                thickness={46}
                sensitivity={SENSITIVITY}
                labels={["L", "R"]}
              />
            </div>
          </div>

          <div style={{ width: 1, background: RULE }} />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 22,
            }}
          >
            <span style={captionStyle}>MONO SUM</span>
            <VuMeter
              src={DEMO_AUDIO_SRC}
              orientation="horizontal"
              channels={1}
              segments={22}
              length={BAR_LENGTH}
              thickness={38}
              sensitivity={SENSITIVITY}
            />
            <HorizontalScale />
            <span style={{ ...captionStyle, fontSize: 20, color: CHROME }}>
              PEAK HOLD ON
            </span>
          </div>
        </div>
      </AbsoluteFill>
    </PreviewFrame>
  );
};
