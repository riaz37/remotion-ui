import type { TikTokPage } from "@remotion/captions";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { getAbsoluteTimeMs, isTokenActive } from "@/remotion/lib/caption-utils";
import { scaleFont } from "@/remotion/lib/layout";
import { EASING } from "@/remotion/lib/motion-tokens";

export type WordPopCaptionsProps = {
  page: TikTokPage;
  color?: string;
  /** Every nth word takes this colour instead. `0` keeps one colour throughout. */
  accentColor?: string;
  accentEvery?: number;
  fontSize?: number;
  fontWeight?: number | string;
  /** Uppercase the word. The default look for this style. */
  uppercase?: boolean;
  /** Peak scale on arrival, before it settles to 1. */
  popScale?: number;
  /** Rotation on arrival, in degrees. Alternates direction word to word. */
  tiltInDegrees?: number;
  /** Frames the pop takes to settle. */
  popInFrames?: number;
  /** Chunky outline behind the word, as used on social captions. */
  strokeWidth?: number;
  strokeColor?: string;
  /**
   * Optional frame override.
   * Pass a parent `frame` when using inside `<Sequence from={...}>`.
   */
  frame?: number;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/**
 * One word at a time, alone on the frame.
 *
 * There is no line context by design: `caption-highlight` and
 * `karaoke-captions` both show a full line with an active word, which is the
 * right thing when the sentence matters. This is the other style — the word *is*
 * the frame, so the eye has nothing to read ahead to and the cut rate carries
 * the energy.
 *
 * Because only one token is on screen, nothing reflows: each word is centred in
 * its own right and can be scaled, tilted and stroked without disturbing a
 * neighbour.
 */
export const WordPopCaptions: React.FC<WordPopCaptionsProps> = ({
  page,
  color = "#fafafa",
  accentColor = "#e8b86d",
  accentEvery = 3,
  fontSize: fontSizeProp,
  fontWeight = 900,
  uppercase = true,
  popScale = 1.16,
  tiltInDegrees = 2.5,
  popInFrames = 6,
  strokeWidth = 0,
  strokeColor = "#0b0b10",
  frame: frameOverride,
}) => {
  const localFrame = useCurrentFrame();
  const frame = frameOverride ?? localFrame;
  const { fps, width } = useVideoConfig();
  const fontSize = fontSizeProp ?? scaleFont(120, width);

  const absoluteTimeMs = getAbsoluteTimeMs(page, frame, fps);
  const index = page.tokens.findIndex((token) =>
    isTokenActive(token, absoluteTimeMs),
  );
  // Between tokens — a gap in the transcript — the frame is deliberately empty
  // rather than holding the last word, which would misattribute the silence.
  if (index === -1) return null;

  const token = page.tokens[index];
  const word = token.text.trim();
  const sinceStart = ((absoluteTimeMs - token.fromMs) / 1000) * fps;
  const pop = interpolate(sinceStart, [0, popInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASING.enter,
  });

  const scale = 1 + (popScale - 1) * (1 - pop);
  // Alternating tilt keeps a long run of words from reading as a stutter of the
  // same frame, which is what a single tilt direction looks like at speed.
  const tilt = tiltInDegrees * (index % 2 === 0 ? 1 : -1) * (1 - pop);
  const accent =
    accentEvery > 0 && (index + 1) % accentEvery === 0 ? accentColor : color;

  return (
    <div
      style={{
        display: "grid",
        placeItems: "center",
        width: "100%",
        textAlign: "center",
      }}
    >
      <span
        style={{
          fontSize,
          fontWeight,
          lineHeight: 1,
          color: accent,
          textTransform: uppercase ? "uppercase" : "none",
          letterSpacing: "-0.02em",
          transform: `scale(${scale}) rotate(${tilt}deg)`,
          opacity: clamp01(pop * 2.4),
          WebkitTextStroke:
            strokeWidth > 0 ? `${strokeWidth}px ${strokeColor}` : undefined,
          paintOrder: "stroke fill",
        }}
      >
        {word}
      </span>
    </div>
  );
};
