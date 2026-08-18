import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { SubtitleCue } from "@/remotion/lib/caption-utils";
import { EASING } from "@/remotion/lib/motion-tokens";

export type TranslatedCue = SubtitleCue & {
  /** The second language for this cue. */
  translation: string;
};

export type SubtitleTranslateProps = {
  cues: TranslatedCue[];
  /** Which line sits on top. */
  primary?: "source" | "translation";
  fontSize?: number;
  /** Size of the secondary line, as a share of `fontSize`. */
  secondaryScale?: number;
  primaryColor?: string;
  secondaryColor?: string;
  fontWeight?: number | string;
  /** Language tags beside each line, e.g. `["EN", "ES"]`. */
  languageLabels?: [string, string];
  labelColor?: string;
  /** Plate behind both lines. `transparent` drops it. */
  backgroundColor?: string;
  /** Width of the block, as a share of the frame. */
  maxWidth?: number;
  /** Frames a cue takes to arrive. */
  enterInFrames?: number;
  /** Frames the second line trails the first by. */
  secondaryOffsetInFrames?: number;
  /**
   * Optional frame override.
   * Pass a parent `frame` when using inside `<Sequence from={...}>`.
   */
  frame?: number;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/**
 * Dual-language subtitles, stacked.
 *
 * The two lines are not equals and are not styled as such: the primary carries
 * full weight and ink, the secondary is smaller and dimmer. Setting both the
 * same makes the block read as one four-line caption, and the viewer has to
 * work out which half is theirs before they can read either.
 *
 * The secondary trails the primary by a few frames. Both appearing on the same
 * frame doubles the amount of new text at once; the small offset gives the eye
 * an order to take them in.
 */
export const SubtitleTranslate: React.FC<SubtitleTranslateProps> = ({
  cues,
  primary = "source",
  fontSize = 46,
  secondaryScale = 0.72,
  primaryColor = "#fafafa",
  secondaryColor = "rgba(250,250,250,0.62)",
  fontWeight = 600,
  languageLabels,
  labelColor = "#e8b86d",
  backgroundColor = "rgba(10,10,14,0.72)",
  maxWidth = 0.78,
  enterInFrames = 10,
  secondaryOffsetInFrames = 4,
  frame: frameOverride,
}) => {
  const localFrame = useCurrentFrame();
  const frame = frameOverride ?? localFrame;
  const { fps } = useVideoConfig();
  const timeMs = (frame / fps) * 1000;

  const cue = cues.find((entry) => entry.startMs <= timeMs && entry.endMs > timeMs);
  // Nothing is drawn between cues. Unlike a speaker track, a translation block
  // is tall enough that holding it through a pause covers the shot.
  if (!cue) return null;

  const startFrame = (cue.startMs / 1000) * fps;
  const arrive = (offset: number) =>
    interpolate(
      frame,
      [startFrame + offset, startFrame + offset + enterInFrames],
      [0, 1],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASING.enter },
    );

  const lines =
    primary === "source"
      ? [
          { text: cue.text, label: languageLabels?.[0], lead: true },
          { text: cue.translation, label: languageLabels?.[1], lead: false },
        ]
      : [
          { text: cue.translation, label: languageLabels?.[1], lead: true },
          { text: cue.text, label: languageLabels?.[0], lead: false },
        ];

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: fontSize,
      }}
    >
      <div
        style={{
          maxWidth: `${maxWidth * 100}%`,
          background: backgroundColor,
          borderRadius: fontSize * 0.36,
          padding: `${fontSize * 0.5}px ${fontSize * 0.75}px`,
          display: "grid",
          gap: fontSize * 0.22,
          textAlign: "center",
        }}
      >
        {lines.map((line, index) => {
          const progress = arrive(index === 0 ? 0 : secondaryOffsetInFrames);
          const size = line.lead ? fontSize : fontSize * secondaryScale;

          return (
            <div
              key={line.text}
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "center",
                gap: fontSize * 0.35,
                opacity: clamp01(progress * 1.5),
                translate: `0 ${(1 - clamp01(progress)) * fontSize * 0.3}px`,
              }}
            >
              {line.label ? (
                <span
                  style={{
                    color: labelColor,
                    fontSize: size * 0.5,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    // The tag is a fixed-width column so the two lines start on
                    // the same left edge even though their type sizes differ.
                    minWidth: fontSize * 1.1,
                    textAlign: "right",
                    flexShrink: 0,
                  }}
                >
                  {line.label}
                </span>
              ) : null}
              <span
                style={{
                  color: line.lead ? primaryColor : secondaryColor,
                  fontSize: size,
                  fontWeight: line.lead ? fontWeight : 500,
                  lineHeight: 1.25,
                }}
              >
                {line.text}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
