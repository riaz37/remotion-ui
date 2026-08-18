import { loadFont } from "@remotion/google-fonts/Inter";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CODE_THEMES } from "@/remotion/lib/code-syntax";
import { getSafeAreaPadding } from "@/remotion/lib/layout";
import { EASING } from "@/remotion/lib/motion-tokens";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export type StatCardProps = {
  /** The number the counter lands on. */
  value?: number;
  /**
   * What the number is out of. With it, the ring is a meter filling to
   * `value / max`; without it the ring draws a full sweep, so a count like
   * "3 dependencies" is not rendered as 3% of something.
   */
  max?: number;
  /** Unit after the number, e.g. "%" or "k". */
  suffix?: string;
  /** Unit before the number, e.g. "$". */
  prefix?: string;
  /** Decimal places while counting and at rest. */
  decimals?: number;
  label?: string;
  /** Line under the label — the source, the window, the cohort. */
  caption?: string;
  /** Change against the previous period, e.g. 12 for "+12%". */
  delta?: number;
  /** Unit on the delta chip. */
  deltaSuffix?: string;
  backgroundColor?: string;
  accentColor?: string;
  theme?: "dark" | "light";
  /**
   * Seconds after which the scene leaves. Omit to hold — correct inside a
   * `TransitionSeries`, where the transition covers the tail, and wrong on
   * its own, where the scene stands still for the rest of the clip.
   */
  holdSeconds?: number;
  /** Animation speed multiplier. */
  speed?: number;
};

/** Beat plan in seconds. */
const T = {
  ring: 0.1,
  ringFor: 1.5,
  count: 0.16,
  /** Long enough that the roll is caught mid-count by a sampled still, not
   *  only at its final value. */
  countFor: 2.2,
  label: 0.6,
  caption: 0.78,
  /** Delta lands after the number has settled, and settles before the exit. */
  delta: 2.7,
  exitFor: 0.4,
} as const;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/**
 * A number landing rather than a ring and a digit fading in together: the ring
 * fills to the share the value represents while the counter rolls up under it,
 * the label settles, and the change against the last period lands last — once
 * the number it is qualifying has stopped moving.
 */
export const StatCard: React.FC<StatCardProps> = ({
  value = 98,
  max,
  suffix = "%",
  prefix,
  decimals = 0,
  label = "Satisfaction",
  caption,
  delta,
  deltaSuffix = "%",
  backgroundColor,
  accentColor = "#2DD4BF",
  theme = "dark",
  holdSeconds,
  speed = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const palette = CODE_THEMES[theme];
  const safe = getSafeAreaPadding({ width, height });

  const at = (seconds: number) => (seconds * fps) / speed;
  const ease = (from: number, to: number, easing = EASING.enter) =>
    interpolate(frame, [at(from), at(to)], [0, 1], { easing, ...clamp });
  // Exits accelerate away; entrances decelerate in. Never ease-out an exit.
  const exit =
    holdSeconds === undefined
      ? 0
      : interpolate(
          frame,
          [at(holdSeconds), at(holdSeconds + T.exitFor)],
          [0, 1],
          { easing: EASING.exit, ...clamp },
        );

  const stage = {
    w: width - safe.paddingLeft - safe.paddingRight,
    h: height - safe.paddingTop - safe.paddingBottom,
  };
  const portrait = height > width;
  const u = portrait
    ? Math.min(stage.w / 620, stage.h / 1120)
    : Math.min(stage.w / 1120, stage.h / 620);

  const share = max && max > 0 ? Math.min(Math.max(value / max, 0), 1) : 1;
  // Ease-out (not the symmetric `editorial` curve) so the ring and the count
  // both make real progress in their first few frames. A host composition
  // that crossfades this scene in (as `showcase` does, over 12 frames) spends
  // that whole transition rendering this scene simultaneously with the
  // outgoing one — with a slow-starting ease, the count is still close to 0
  // by the time the transition resolves and the card is alone on screen, so
  // it reads as a dead counter rather than one mid-animation.
  const ring = ease(T.ring, T.ring + T.ringFor, EASING.enter) * share;
  const counted = ease(T.count, T.count + T.countFor, EASING.enter) * value;
  const labelIn = ease(T.label, T.label + 0.45);
  const captionIn = caption ? ease(T.caption, T.caption + 0.45) : 0;
  const deltaIn =
    delta === undefined
      ? 0
      : spring({
          frame: frame - at(T.delta),
          fps,
          config: { damping: 13, stiffness: 190, mass: 0.6 },
        });
  /** One pulse as the ring closes, so the landing is felt. */
  const land = interpolate(
    frame,
    [at(T.ring + T.ringFor), at(T.ring + T.ringFor + 0.45)],
    [1, 0],
    clamp,
  );

  const size = Math.min(stage.w * 0.62, stage.h * 0.62, 380 * u);
  const stroke = 9 * u;
  const radius = size / 2 - stroke;
  const circumference = 2 * Math.PI * radius;

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
          background: `radial-gradient(ellipse 55% 50% at 50% 45%, ${accentColor}1A, transparent 72%)`,
        }}
      />

      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 18 * u,
          opacity: 1 - exit,
          translate: `0 ${exit * -26 * u}px`,
        }}
      >
        <div style={{ position: "relative", width: size, height: size }}>
          <svg
            width={size}
            height={size}
            style={{ rotate: "-90deg" }}
          >
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={palette.band}
              strokeWidth={stroke}
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={accentColor}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - ring)}
              style={{
                filter: `drop-shadow(0 0 ${(10 + land * 16) * u}px ${accentColor})`,
              }}
            />
          </svg>

          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: palette.fg,
              fontSize: 92 * u,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              fontVariantNumeric: "tabular-nums",
              scale: interpolate(land, [0, 1], [1, 1.03], {
                output: "perceptual-scale",
                ...clamp,
              }),
            }}
          >
            {prefix ? (
              <span style={{ fontSize: 54 * u, alignSelf: "flex-start", marginTop: 20 * u }}>
                {prefix}
              </span>
            ) : null}
            {counted.toFixed(decimals)}
            {suffix ? (
              <span style={{ fontSize: 54 * u, color: accentColor }}>
                {suffix}
              </span>
            ) : null}
          </div>
        </div>

        {label ? (
          <div
            style={{
              color: palette.fg,
              fontSize: 34 * u,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              opacity: labelIn,
              translate: `0 ${(1 - labelIn) * 12 * u}px`,
            }}
          >
            {label}
          </div>
        ) : null}

        {caption ? (
          <div
            style={{
              marginTop: -8 * u,
              color: palette.faint,
              fontSize: 21 * u,
              opacity: captionIn,
            }}
          >
            {caption}
          </div>
        ) : null}

        {delta !== undefined ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8 * u,
              padding: `${8 * u}px ${15 * u}px`,
              borderRadius: 999,
              background: `${accentColor}18`,
              border: `1px solid ${accentColor}55`,
              color: accentColor,
              fontSize: 22 * u,
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
              opacity: Math.min(deltaIn, 1),
              scale: interpolate(Math.min(deltaIn, 1), [0, 1], [0.86, 1], {
                output: "perceptual-scale",
              }),
            }}
          >
            <svg width={16 * u} height={16 * u} viewBox="0 0 16 16" fill="none">
              <path
                d={delta < 0 ? "M8 3v10m0 0 4-4m-4 4-4-4" : "M8 13V3m0 0 4 4M8 3 4 7"}
                stroke={accentColor}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {delta > 0 ? "+" : ""}
            {delta}
            {deltaSuffix}
          </div>
        ) : null}
      </div>
    </div>
  );
};
