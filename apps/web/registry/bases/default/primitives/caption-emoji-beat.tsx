import { interpolate, useCurrentFrame } from "remotion";
import { EASING } from "@/remotion/lib/motion-tokens";

export type EmojiBeat = {
  emoji: string;
  /** Frame the emoji lands on. */
  atInFrames: number;
  /** Position in percent of the frame, from the top-left. */
  x: number;
  y: number;
  /** Size in px. Defaults to `size`. */
  scale?: number;
  /** Resting tilt in degrees. */
  rotate?: number;
};

export type CaptionEmojiBeatProps = {
  beats: EmojiBeat[];
  /** Caption line the emoji punctuate. Omit to use emoji alone. */
  text?: string;
  color?: string;
  fontSize?: number;
  fontWeight?: number | string;
  /** Base emoji size in px. */
  size?: number;
  /** Frames an emoji takes to land. */
  landInFrames?: number;
  /** Frames it holds at full size before releasing. */
  holdInFrames?: number;
  /** Overshoot on the way in. 1 lands flat. */
  overshoot?: number;
  /** Wobble after landing, in degrees. */
  wobbleInDegrees?: number;
  /** Frame the caption line arrives on. */
  textAtInFrames?: number;
  /**
   * Optional frame override.
   * Pass a parent `frame` when using inside `<Sequence from={...}>`.
   */
  frame?: number;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/**
 * Emoji stamps landing on the beat, over an optional caption line.
 *
 * Each emoji is scheduled on its own frame rather than derived from audio: the
 * beats of a track are known when the edit is cut, and reading them from an
 * envelope at render time makes the punctuation drift against the music it is
 * supposed to be hitting.
 *
 * An emoji arrives with overshoot, wobbles once, then releases. The wobble is
 * what stops a row of stamps from reading as a static sticker sheet — it decays
 * to nothing, so a held frame is still and only the arrivals move.
 */
export const CaptionEmojiBeat: React.FC<CaptionEmojiBeatProps> = ({
  beats,
  text,
  color = "#fafafa",
  fontSize = 64,
  fontWeight = 800,
  size = 84,
  landInFrames = 7,
  holdInFrames = 26,
  overshoot = 1.35,
  wobbleInDegrees = 9,
  textAtInFrames = 0,
  frame: frameOverride,
}) => {
  const localFrame = useCurrentFrame();
  const frame = frameOverride ?? localFrame;

  const textProgress = interpolate(
    frame,
    [textAtInFrames, textAtInFrames + 12],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASING.enter },
  );

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {text ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            padding: "0 12%",
            textAlign: "center",
            color,
            fontSize,
            fontWeight,
            lineHeight: 1.15,
            opacity: clamp01(textProgress),
            transform: `translateY(${(1 - textProgress) * 18}px)`,
          }}
        >
          {text}
        </div>
      ) : null}

      {beats.map((beat, index) => {
        const since = frame - beat.atInFrames;
        if (since < -1) return null;

        const land = interpolate(since, [0, landInFrames], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASING.enter,
        });
        // The release is shorter than the landing and accelerates away, so a
        // stamp never lingers past the beat it belongs to.
        const release = interpolate(
          since,
          [landInFrames + holdInFrames, landInFrames + holdInFrames + 10],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASING.exit },
        );

        const scale =
          (1 + (overshoot - 1) * Math.sin(Math.PI * clamp01(land))) *
          land *
          (1 - release * 0.4);
        // One damped swing, keyed to the landing rather than to the clock, so
        // every stamp wobbles the same amount regardless of when it arrives.
        const wobble =
          wobbleInDegrees *
          Math.sin(since * 0.55) *
          Math.exp(-Math.max(0, since - landInFrames) / 7) *
          clamp01(land);

        return (
          <span
            key={`${beat.emoji}-${beat.atInFrames}-${index}`}
            style={{
              position: "absolute",
              left: `${beat.x}%`,
              top: `${beat.y}%`,
              fontSize: beat.scale ?? size,
              lineHeight: 1,
              transform: `translate(-50%, -50%) scale(${scale}) rotate(${(beat.rotate ?? 0) + wobble}deg)`,
              opacity: clamp01(land * 2) * (1 - release),
            }}
          >
            {beat.emoji}
          </span>
        );
      })}
    </div>
  );
};
