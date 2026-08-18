import {
  random,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type VoiceNoteBubbleProps = {
  /** Length of the note. The playhead crosses the bar over exactly this. */
  durationInFrames: number;
  /**
   * Bar heights, 0–1, oldest first. Omit and a deterministic speech-shaped
   * envelope is generated from `seed`.
   */
  waveform?: number[];
  /** How many bars to draw when `waveform` is generated. */
  barCount?: number;
  /** Changes the generated envelope without touching any other prop. */
  seed?: number;
  width?: number;
  /** Height of the tallest bar. */
  barHeight?: number;
  barWidth?: number;
  gap?: number;
  /** Bubble plate. `transparent` drops it. */
  bubbleColor?: string;
  /** Bars already played. */
  playedColor?: string;
  /** Bars not yet reached. */
  unplayedColor?: string;
  inkColor?: string;
  /** Round avatar or icon at the left of the bubble. */
  avatar?: string;
  avatarColor?: string;
  /** Sender name above the waveform. */
  sender?: string;
  /** Elapsed / total readout under the bar. */
  showTime?: boolean;
  /** Which side of the frame the bubble sits on. */
  align?: "left" | "right";
  /** Dot riding the boundary between played and unplayed. */
  showPlayhead?: boolean;
  /** Frames before the playhead starts moving. */
  delayInFrames?: number;
  /**
   * Optional frame override.
   * Pass a parent `frame` when using inside `<Sequence from={...}>`.
   */
  frame?: number;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/**
 * Deterministic speech-shaped envelope.
 *
 * Real speech is bursts of syllables inside phrases, with short gaps between
 * them — flat noise reads as a machine, and a single sine reads as a tone. Two
 * incommensurate rates give the syllable rhythm, a slower one gives the phrase,
 * and a hash keeps individual bars from lining up into a visible pattern.
 */
function generateWaveform(count: number, seed: number): number[] {
  return Array.from({ length: count }, (_, index) => {
    const position = index / Math.max(1, count - 1);
    const syllable = Math.abs(Math.sin(index * 0.9 + seed));
    const phrase = 0.55 + 0.45 * Math.sin(position * Math.PI * 2.3 + seed * 1.7);
    // Remotion's seeded generator (doc rule 2). The `Math.sin(x) * 43758.5453`
    // idiom this replaces is a GLSL trick that drifts across JS float paths.
    // The two sines above stay — they are the syllable and phrase envelopes,
    // bounded signal shaping rather than a hash.
    const hash = random(`${seed}-${index}`);
    return clamp01(0.18 + syllable * phrase * 0.7 + hash * 0.18);
  });
}

function formatTime(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

/**
 * A chat-style audio message: waveform, playhead and running time.
 *
 * The waveform is static and the *colour* moves through it, which is how every
 * messaging app draws this. A bar chart that animated its heights would be a
 * live spectrum — a different claim entirely, and one that contradicts the fact
 * that a voice note's shape is known before you press play.
 *
 * Playback position comes from `durationInFrames`, not from audio analysis, so
 * the bubble can be shown over a note that is described rather than played.
 */
export const VoiceNoteBubble: React.FC<VoiceNoteBubbleProps> = ({
  durationInFrames,
  waveform,
  barCount = 42,
  seed = 1,
  width = 480,
  barHeight = 44,
  barWidth = 4,
  gap = 4,
  bubbleColor = "rgba(20,20,28,0.92)",
  playedColor = "#e8b86d",
  unplayedColor = "rgba(250,250,250,0.22)",
  inkColor = "#fafafa",
  avatar,
  avatarColor = "#2dd4bf",
  sender,
  showTime = true,
  align = "left",
  showPlayhead = true,
  delayInFrames = 0,
  frame: frameOverride,
}) => {
  const localFrame = useCurrentFrame();
  const frame = frameOverride ?? localFrame;
  const { fps } = useVideoConfig();

  const bars = waveform ?? generateWaveform(barCount, seed);
  const played = clamp01(
    (frame - delayInFrames) / Math.max(1, durationInFrames),
  );
  const elapsed = (played * durationInFrames) / fps;
  const total = durationInFrames / fps;
  const avatarSize = barHeight * 1.1;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: align === "left" ? "flex-start" : "flex-end",
        width: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: barHeight * 0.38,
          background: bubbleColor,
          borderRadius: barHeight,
          padding: `${barHeight * 0.42}px ${barHeight * 0.55}px`,
          maxWidth: width,
        }}
      >
        {avatar ? (
          <div
            style={{
              width: avatarSize,
              height: avatarSize,
              borderRadius: "50%",
              background: avatarColor,
              display: "grid",
              placeItems: "center",
              color: "#0b0b10",
              fontSize: avatarSize * 0.46,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {avatar}
          </div>
        ) : null}

        <div style={{ display: "grid", gap: barHeight * 0.16 }}>
          {sender ? (
            <span
              style={{
                color: playedColor,
                fontSize: barHeight * 0.3,
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              {sender}
            </span>
          ) : null}

          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap,
              height: barHeight,
            }}
          >
            {bars.map((value, index) => {
              const position = index / Math.max(1, bars.length - 1);
              // A bar flips colour when the playhead passes its centre, and the
              // one being crossed is blended, so the boundary moves smoothly
              // instead of stepping bar by bar.
              const crossing = clamp01(
                (played - position) * bars.length + 0.5,
              );

              return (
                <div
                  key={index}
                  style={{
                    width: barWidth,
                    height: Math.max(barWidth, barHeight * value),
                    borderRadius: barWidth,
                    background: crossing > 0.5 ? playedColor : unplayedColor,
                    opacity: crossing > 0.5 ? 1 : 0.75 + crossing * 0.25,
                  }}
                />
              );
            })}

            {showPlayhead && played > 0 && played < 1 ? (
              <div
                style={{
                  position: "absolute",
                  left: `${played * 100}%`,
                  top: "50%",
                  width: barWidth * 2.2,
                  height: barWidth * 2.2,
                  marginLeft: -barWidth * 1.1,
                  marginTop: -barWidth * 1.1,
                  borderRadius: "50%",
                  background: inkColor,
                }}
              />
            ) : null}
          </div>

          {showTime ? (
            <span
              style={{
                color: inkColor,
                opacity: 0.6,
                fontSize: barHeight * 0.28,
                fontWeight: 600,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {formatTime(elapsed)} / {formatTime(total)}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
};
