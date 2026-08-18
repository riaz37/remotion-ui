import { loadFont } from "@remotion/google-fonts/Inter";
import { Img, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { CODE_THEMES } from "@/remotion/lib/code-syntax";
import { getSafeAreaPadding } from "@/remotion/lib/layout";
import { EASING } from "@/remotion/lib/motion-tokens";
import { fitHeadline } from "@/remotion/lib/text-fit-utils";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export type AutoFitTitleProps = {
  /** Headline. Sized to fill the safe area whatever its length. */
  title: string;
  subtitle?: string;
  logoSrc?: string;
  logoSize?: number;
  /** Ceiling for the fitted size, at a 1080-wide stage. */
  maxFontSize?: number;
  /** Floor for the fitted size, so a very long title stays legible. */
  minFontSize?: number;
  accentColor?: string;
  backgroundColor?: string;
  theme?: "dark" | "light";
  /** Animation speed multiplier. */
  speed?: number;
  /**
   * Seconds after which the card leaves. Omit to hold. Inside a
   * `TransitionSeries` set it so the exit finishes a few frames *before* the
   * cut begins — otherwise the headline is still at full opacity while the next
   * scene's own heading fades up over it, and the overlap reads as one title
   * printed on top of another.
   */
  holdSeconds?: number;
};

/** Beat plan in seconds. */
const T = {
  logo: 0,
  title: 0.2,
  /** Added per word. */
  wordStagger: 0.06,
  subtitle: 0.72,
} as const;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/**
 * A headline sized to the frame it is given, then set in motion word by word:
 * the fit is measured before anything animates, so a two-word title and a
 * twelve-word title both fill the safe area and both land the same way.
 */
export const AutoFitTitle: React.FC<AutoFitTitleProps> = ({
  title,
  subtitle,
  logoSrc,
  logoSize,
  maxFontSize = 128,
  minFontSize = 34,
  accentColor = "#E8B86D",
  backgroundColor,
  theme = "dark",
  speed = 1,
  holdSeconds,
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

  const words = title.split(/\s+/).filter(Boolean);
  const fontSize = fitHeadline({
    text: title,
    maxWidth: stage.w,
    maxFontSize: maxFontSize * u,
    minFontSize: minFontSize * u,
  });

  const logoIn = logoSrc ? ease(T.logo, T.logo + 0.45) : 0;
  const subtitleIn = subtitle ? ease(T.subtitle, T.subtitle + 0.5) : 0;
  /** Slow push, so the card is never dead still on a hold. */
  const push = ease(0, 7, EASING.editorial);
  /** Exits accelerate away; entrances decelerate in. Never ease-out an exit. */
  const exit =
    holdSeconds === undefined ? 0 : ease(holdSeconds, holdSeconds + 0.4, EASING.exit);

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
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 64% 50% at 50% 46%, ${accentColor}1A, transparent 72%)`,
          scale: `${interpolate(push, [0, 1], [1, 1.1])}`,
        }}
      />

      <div
        style={{
          position: "relative",
          width: stage.w,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20 * u,
          textAlign: "center",
          opacity: 1 - exit,
          scale: interpolate(push, [0, 1], [1, 1.02], {
            output: "perceptual-scale",
          }),
          translate: `0px ${-exit * 8 * u}px`,
        }}
      >
        {logoSrc ? (
          <Img
            src={logoSrc}
            style={{
              width: logoSize ?? 70 * u,
              height: logoSize ?? 70 * u,
              objectFit: "contain",
              opacity: logoIn,
              translate: `0 ${(1 - logoIn) * 12 * u}px`,
            }}
          />
        ) : null}

        <h1
          style={{
            margin: 0,
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: `${0.08 * fontSize}px ${0.26 * fontSize}px`,
            color: palette.fg,
            fontSize,
            fontWeight: 700,
            lineHeight: 1.04,
            letterSpacing: "-0.03em",
          }}
        >
          {words.map((word, index) => {
            const wordIn = ease(
              T.title + index * T.wordStagger,
              T.title + index * T.wordStagger + 0.5,
            );
            return (
              // Word-level masks: the fitted line assembles instead of scaling
              // in, which would fight the whole point of fitting it first.
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
        </h1>

        {subtitle ? (
          <p
            style={{
              margin: 0,
              maxWidth: stage.w * 0.74,
              color: palette.dim,
              fontSize: Math.max(fontSize * 0.3, 22 * u),
              fontWeight: 500,
              lineHeight: 1.35,
              opacity: subtitleIn,
              translate: `0 ${(1 - subtitleIn) * 12 * u}px`,
            }}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
};
