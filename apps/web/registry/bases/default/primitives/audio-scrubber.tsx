import {
  random,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type AudioScrubberProps = {
  /** Total length of the clip. The playhead crosses the track over exactly this. */
  durationInFrames: number;
  /**
   * Bar heights, 0–1, oldest first. Omit and a deterministic envelope is
   * generated from `seed`.
   */
  waveform?: number[];
  /** How many bars to draw when `waveform` is generated. */
  barCount?: number;
  seed?: number;
  width?: number;
  height?: number;
  barWidth?: number;
  gap?: number;
  /** Bars already played. */
  playedColor?: string;
  /** Bars not yet reached. */
  unplayedColor?: string;
  /** Playhead rule and its handle. */
  playheadColor?: string;
  labelColor?: string;
  /** Elapsed and total readouts either side of the track. */
  showTime?: boolean;
  /** Markers at these frame positions — chapter points, quotes, cuts. */
  marks?: { atInFrames: number; label?: string }[];
  markColor?: string;
  /** Mirror the bars below the centre line, as an editor does. */
  mirrored?: boolean;
  /** Frames before the playhead starts moving. */
  delayInFrames?: number;
  /**
   * Optional frame override.
   * Pass a parent `frame` when using inside `<Sequence from={...}>`.
   */
  frame?: number;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** Deterministic envelope with phrase-level shape — see `voice-note-bubble`. */
function generateWaveform(count: number, seed: number): number[] {
  return Array.from({ length: count }, (_, index) => {
    const position = index / Math.max(1, count - 1);
    const syllable = Math.abs(Math.sin(index * 0.7 + seed * 2.1));
    const phrase = 0.5 + 0.5 * Math.sin(position * Math.PI * 3.1 + seed);
    // Remotion's seeded generator (doc rule 2). The `Math.sin(x) * 43758.5453`
    // idiom this replaces is a GLSL trick that drifts across JS float paths.
    // The two sines above stay — they are the syllable and phrase envelopes,
    // bounded signal shaping rather than a hash.
    const hash = random(`${seed}-${index}`);
    return clamp01(0.2 + syllable * phrase * 0.66 + hash * 0.2);
  });
}

function formatTime(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

/**
 * A waveform with a travelling playhead and time labels.
 *
 * Position comes from `durationInFrames` rather than from audio analysis, so
 * the scrubber can front a clip that is only being described — and, more
 * usefully, so the playhead lands exactly on the frame the edit says it should
 * rather than wherever a detector happens to think the audio is.
 *
 * The waveform itself is static and the colour boundary moves through it. That
 * is the shape of a file, known before playback; animating the bar heights
 * would be a live spectrum, which is `audiogram-bars`.
 */
export const AudioScrubber: React.FC<AudioScrubberProps> = ({
  durationInFrames,
  waveform,
  barCount = 96,
  seed = 1,
  width = 720,
  height = 96,
  barWidth = 4,
  gap = 3,
  playedColor = "#e8b86d",
  unplayedColor = "rgba(250,250,250,0.2)",
  playheadColor = "#fafafa",
  labelColor = "rgba(250,250,250,0.6)",
  showTime = true,
  marks,
  markColor = "#2dd4bf",
  mirrored = true,
  delayInFrames = 0,
  frame: frameOverride,
}) => {
  const localFrame = useCurrentFrame();
  const frame = frameOverride ?? localFrame;
  const { fps } = useVideoConfig();

  const bars = waveform ?? generateWaveform(barCount, seed);
  const played = clamp01((frame - delayInFrames) / Math.max(1, durationInFrames));
  const elapsed = (played * durationInFrames) / fps;
  const total = durationInFrames / fps;
  const labelSize = height * 0.22;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: height * 0.24,
        width,
      }}
    >
      {showTime ? (
        <span
          style={{
            color: labelColor,
            fontSize: labelSize,
            fontWeight: 600,
            fontVariantNumeric: "tabular-nums",
            minWidth: labelSize * 2.6,
          }}
        >
          {formatTime(elapsed)}
        </span>
      ) : null}

      <div
        style={{
          position: "relative",
          flex: 1,
          height,
          display: "flex",
          alignItems: "center",
          gap,
        }}
      >
        {bars.map((value, index) => {
          const position = index / Math.max(1, bars.length - 1);
          const crossing = clamp01((played - position) * bars.length + 0.5);
          const barHeight = Math.max(barWidth, height * (mirrored ? value : value * 0.9));

          return (
            <div
              key={index}
              style={{
                width: barWidth,
                height: barHeight,
                borderRadius: barWidth,
                alignSelf: mirrored ? "center" : "flex-end",
                background: crossing > 0.5 ? playedColor : unplayedColor,
              }}
            />
          );
        })}

        {marks?.map((mark) => {
          const position = clamp01(mark.atInFrames / Math.max(1, durationInFrames));
          return (
            <div
              key={mark.atInFrames}
              style={{
                position: "absolute",
                left: `${position * 100}%`,
                top: 0,
                bottom: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-start",
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  width: 2,
                  height: "100%",
                  background: markColor,
                  opacity: 0.55,
                }}
              />
              {mark.label ? (
                <span
                  style={{
                    position: "absolute",
                    top: -labelSize * 1.5,
                    color: markColor,
                    fontSize: labelSize * 0.85,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                  }}
                >
                  {mark.label}
                </span>
              ) : null}
            </div>
          );
        })}

        <div
          style={{
            position: "absolute",
            left: `${played * 100}%`,
            top: -height * 0.06,
            bottom: -height * 0.06,
            width: 2,
            marginLeft: -1,
            background: playheadColor,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: `${played * 100}%`,
            top: "50%",
            width: height * 0.14,
            height: height * 0.14,
            marginLeft: -height * 0.07,
            marginTop: -height * 0.07,
            borderRadius: "50%",
            background: playheadColor,
          }}
        />
      </div>

      {showTime ? (
        <span
          style={{
            color: labelColor,
            fontSize: labelSize,
            fontWeight: 600,
            fontVariantNumeric: "tabular-nums",
            minWidth: labelSize * 2.6,
            textAlign: "right",
          }}
        >
          {formatTime(total)}
        </span>
      ) : null}
    </div>
  );
};
