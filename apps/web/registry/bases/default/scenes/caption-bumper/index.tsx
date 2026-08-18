import { loadFont } from "@remotion/google-fonts/Inter";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { CODE_THEMES } from "@/remotion/lib/code-syntax";
import { getSafeAreaPadding } from "@/remotion/lib/layout";
import { EASING } from "@/remotion/lib/motion-tokens";
import { fitHeadline } from "@/remotion/lib/text-fit-utils";

const { fontFamily } = loadFont("normal", {
  weights: ["500", "600", "700"],
  subsets: ["latin"],
});

export type CaptionBumperProps = {
  /** The line the bumper exists to land. */
  text: string;
  /** Small label above it — segment, chapter, timestamp. */
  eyebrow?: string;
  /** Largest type size at a 1280-wide stage. */
  maxFontSize?: number;
  /**
   * Seconds the line holds before the bumper wipes out. Omit to hold to the end
   * of the composition.
   */
  holdSeconds?: number;
  backgroundColor?: string;
  accentColor?: string;
  theme?: "dark" | "light";
  /** Animation speed multiplier. */
  speed?: number;
};

/** Beat plan in seconds. */
const T = {
  /** Ground wipes in behind the line. */
  ground: 0,
  groundFor: 0.4,
  eyebrow: 0.16,
  word: 0.3,
  /** Added per word — capped so long copy still finishes inside `wordsBudget`. */
  wordStagger: 0.055,
  /**
   * Total span every word must have started landing within, regardless of
   * word count. Without this, long copy (or a 2x-length stress test) staggers
   * so far past the beat that later words are still mid-slide, clipped by
   * their own reveal mask, when the line is supposed to be fully readable —
   * the clipped fragment reads as a ghost overlapping the settled words.
   */
  wordsBudget: 0.7,
  /** Rule draws under the line once the words have landed. */
  rule: 0.62,
  exitFor: 0.36,
} as const;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/**
 * A bumper that punches its line in rather than fading a sentence up: the
 * ground wipes in, the words land one after another, a rule draws under them,
 * and the whole card wipes out again when its hold is over — the shape a
 * between-beats card actually needs.
 */
export const CaptionBumper: React.FC<CaptionBumperProps> = ({
  text,
  eyebrow,
  maxFontSize = 84,
  holdSeconds,
  backgroundColor,
  accentColor = "#F472B6",
  theme = "dark",
  speed = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const palette = CODE_THEMES[theme];
  const safe = getSafeAreaPadding({ width, height });

  const at = (seconds: number) => (seconds * fps) / speed;
  const ease = (from: number, to: number, easing = EASING.enter) =>
    interpolate(frame, [at(from), at(to)], [0, 1], { easing, ...clamp });

  const stage = {
    w: width - safe.paddingLeft - safe.paddingRight,
    h: height - safe.paddingTop - safe.paddingBottom,
  };
  const portrait = height > width;
  const u = portrait
    ? Math.min(stage.w / 620, stage.h / 1120)
    : Math.min(stage.w / 1120, stage.h / 620);

  const words = text.split(/\s+/).filter(Boolean);
  const fontSize = fitHeadline({
    text,
    maxWidth: stage.w,
    maxFontSize: maxFontSize * u,
    minFontSize: 30 * u,
  });

  const ground = ease(T.ground, T.ground + T.groundFor, EASING.editorial);
  const eyebrowIn = eyebrow ? ease(T.eyebrow, T.eyebrow + 0.4) : 0;
  // Longer copy gets a tighter per-word stagger so the whole line always
  // finishes landing inside `wordsBudget`, instead of the reveal stretching
  // past the beat and leaving trailing words visibly mid-clip at the hold.
  const wordStagger =
    words.length > 1
      ? Math.min(T.wordStagger, T.wordsBudget / (words.length - 1))
      : 0;
  const lastWord = T.word + (words.length - 1) * wordStagger + 0.4;
  const rule = ease(Math.max(T.rule, lastWord - 0.1), lastWord + 0.4, EASING.editorial);
  const exit =
    holdSeconds === undefined
      ? 0
      : interpolate(
          frame,
          [at(holdSeconds), at(holdSeconds + T.exitFor)],
          [0, 1],
          { easing: EASING.exit, ...clamp },
        );

  return (
    <div
      style={{
        width,
        height,
        background: backgroundColor ?? palette.page,
        fontFamily,
        position: "relative",
        overflow: "hidden",
        display: "grid",
        placeItems: "center",
      }}
    >
      {/* Ground: a tinted field that wipes in from the centre out */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 70% 55% at 50% 50%, ${accentColor}22, transparent 72%)`,
          clipPath: `inset(${(1 - ground) * 50}% 0 ${(1 - ground) * 50}% 0)`,
          opacity: 1 - exit,
        }}
      />

      <div
        style={{
          position: "relative",
          width: stage.w,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16 * u,
          textAlign: "center",
          opacity: 1 - exit,
          translate: `0 ${exit * -22 * u}px`,
        }}
      >
        {eyebrow ? (
          <div
            style={{
              color: accentColor,
              fontSize: 22 * u,
              fontWeight: 600,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              opacity: eyebrowIn,
              translate: `0 ${(1 - eyebrowIn) * 10 * u}px`,
            }}
          >
            {eyebrow}
          </div>
        ) : null}

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: `${0.1 * fontSize}px ${0.28 * fontSize}px`,
            color: palette.fg,
            fontSize,
            fontWeight: 700,
            lineHeight: 1.06,
            letterSpacing: "-0.03em",
          }}
        >
          {words.map((word, index) => {
            const wordIn = ease(
              T.word + index * wordStagger,
              T.word + index * wordStagger + 0.4,
            );
            return (
              // Each word lands out of its own mask, so the line reads as
              // spoken rather than as one block appearing.
              <span
                key={`${word}-${index}`}
                style={{ display: "block", overflow: "hidden" }}
              >
                <span
                  style={{
                    display: "block",
                    translate: `0 ${(1 - wordIn) * 100}%`,
                  }}
                >
                  {word}
                </span>
              </span>
            );
          })}
        </div>

        <div
          style={{
            width: fontSize * 2.2,
            height: 4 * u,
            borderRadius: 999,
            background: accentColor,
            boxShadow: `0 0 ${16 * u}px ${accentColor}88`,
            transformOrigin: "center",
            scale: `${rule} 1`,
          }}
        />
      </div>
    </div>
  );
};
