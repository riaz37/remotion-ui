import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { SubtitleCue } from "@/remotion/lib/caption-utils";
import { EASING } from "@/remotion/lib/motion-tokens";

export type SpeakerStyle = {
  name: string;
  color?: string;
  /** Which side of the frame this speaker's card sits on. */
  align?: "left" | "right";
};

export type SpeakerLabelCaptionsProps = {
  /** Cues carrying a `speaker`. Cues without one fall back to `defaultSpeaker`. */
  cues: SubtitleCue[];
  /** Colour and side per speaker, keyed by name. */
  speakers?: SpeakerStyle[];
  /** Speaker used for cues that carry none. */
  defaultSpeaker?: string;
  colors?: string[];
  fontSize?: number;
  fontWeight?: number | string;
  inkColor?: string;
  cardColor?: string;
  /** Width of the card, as a share of the frame. */
  maxWidth?: number;
  /** Keep the previous speaker's card on screen, dimmed. */
  showPrevious?: boolean;
  /** Frames a card takes to arrive. */
  enterInFrames?: number;
  /**
   * Optional frame override.
   * Pass a parent `frame` when using inside `<Sequence from={...}>`.
   */
  frame?: number;
};

const DEFAULT_COLORS = ["#e8b86d", "#2dd4bf", "#f472b6", "#8b8bf5"];

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/**
 * A multi-speaker caption track: name tag, colour, and a side of the frame per
 * voice.
 *
 * Speaker identity is carried three ways at once — tag, colour and alignment —
 * because any one of them fails somewhere. A tag alone is slow to read at
 * caption speed, colour alone is invisible to a good share of viewers, and
 * alignment alone cannot tell three speakers apart.
 *
 * Cues are timed in milliseconds so a track parsed from SRT or VTT drops
 * straight in; `parseSubtitles` in `caption-utils` already fills `speaker` from
 * a WebVTT `<v Name>` tag.
 */
export const SpeakerLabelCaptions: React.FC<SpeakerLabelCaptionsProps> = ({
  cues,
  speakers = [],
  defaultSpeaker = "Speaker",
  colors = DEFAULT_COLORS,
  fontSize = 42,
  fontWeight = 600,
  inkColor = "#fafafa",
  cardColor = "rgba(12,12,18,0.82)",
  maxWidth = 0.7,
  showPrevious = true,
  enterInFrames = 10,
  frame: frameOverride,
}) => {
  const localFrame = useCurrentFrame();
  const frame = frameOverride ?? localFrame;
  const { fps } = useVideoConfig();
  const timeMs = (frame / fps) * 1000;

  const names = Array.from(
    new Set(cues.map((cue) => cue.speaker ?? defaultSpeaker)),
  );
  const styleFor = (name: string): Required<SpeakerStyle> => {
    const declared = speakers.find((speaker) => speaker.name === name);
    const order = names.indexOf(name);
    return {
      name,
      color: declared?.color ?? colors[Math.max(0, order) % colors.length],
      // Speakers alternate sides in the order they first appear, which is
      // usually the interviewer / guest order a viewer expects.
      align: declared?.align ?? (order % 2 === 0 ? "left" : "right"),
    };
  };

  const activeIndex = cues.findIndex(
    (cue) => cue.startMs <= timeMs && cue.endMs > timeMs,
  );
  // Between cues the last one stays: a caption card blinking out in every pause
  // is far more distracting than one that holds until the next line.
  const currentIndex =
    activeIndex === -1
      ? cues.reduce(
          (latest, cue, index) => (cue.startMs <= timeMs ? index : latest),
          -1,
        )
      : activeIndex;
  if (currentIndex === -1) return null;

  const visible = showPrevious
    ? [currentIndex - 1, currentIndex].filter((index) => index >= 0)
    : [currentIndex];

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        gap: fontSize * 0.4,
        padding: fontSize,
      }}
    >
      {visible.map((index) => {
        const cue = cues[index];
        const speaker = styleFor(cue.speaker ?? defaultSpeaker);
        const enter = interpolate(
          frame,
          [
            (cue.startMs / 1000) * fps,
            (cue.startMs / 1000) * fps + enterInFrames,
          ],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASING.enter },
        );
        const isCurrent = index === currentIndex;

        return (
          <div
            key={`${cue.startMs}-${cue.text}`}
            style={{
              alignSelf: speaker.align === "left" ? "flex-start" : "flex-end",
              maxWidth: `${maxWidth * 100}%`,
              background: cardColor,
              borderLeft:
                speaker.align === "left"
                  ? `${fontSize * 0.12}px solid ${speaker.color}`
                  : undefined,
              borderRight:
                speaker.align === "right"
                  ? `${fontSize * 0.12}px solid ${speaker.color}`
                  : undefined,
              borderRadius: fontSize * 0.35,
              padding: `${fontSize * 0.42}px ${fontSize * 0.6}px`,
              // The previous line stays legible but clearly secondary — it is
              // context, and competing with the live line would defeat it.
              opacity: (isCurrent ? 1 : 0.38) * clamp01(enter * 1.4),
              translate: `0 ${(1 - clamp01(enter)) * fontSize * 0.5}px`,
            }}
          >
            <div
              style={{
                color: speaker.color,
                fontSize: fontSize * 0.5,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: fontSize * 0.18,
                textAlign: speaker.align === "right" ? "right" : "left",
              }}
            >
              {speaker.name}
            </div>
            <div
              style={{
                color: inkColor,
                fontSize,
                fontWeight,
                lineHeight: 1.25,
                textAlign: speaker.align === "right" ? "right" : "left",
              }}
            >
              {cue.text}
            </div>
          </div>
        );
      })}
    </div>
  );
};
