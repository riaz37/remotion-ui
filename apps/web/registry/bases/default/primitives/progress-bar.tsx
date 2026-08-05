import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { scaleFont } from "@/remotion/lib/layout";
import {
  resolveSpringConfig,
  type MotionSpring,
} from "@/remotion/lib/motion-primitive";
import { EASING } from "@/remotion/lib/motion-tokens";
import { EASING_ENTER } from "@/remotion/lib/timing";

export type ProgressBarProps = {
  /** Value the bar fills to, 0–1. */
  progress?: number;
  /** Value the bar starts from, 0–1. */
  from?: number;
  durationInFrames?: number;
  delayInFrames?: number;
  /** Drive the fill with a spring instead of the ease-out curve. */
  spring?: MotionSpring;
  /** Loop a shuttle across the track — work with no known end. */
  indeterminate?: boolean;
  label?: string;
  /** Percentage readout on the right of the label row. */
  showValue?: boolean;
  /** Override the readout text. */
  formatValue?: (progress: number) => string;
  /** Divide the track into equal steps. */
  segments?: number;
  color?: string;
  trackColor?: string;
  labelColor?: string;
  /** Bar thickness. Scales with the frame by default. */
  height?: number;
  /** Corner radius. Defaults to a full round cap. */
  radius?: number;
  /** Soft light carried by the leading edge of the fill. */
  glow?: boolean;
  /** Width of the whole control. */
  width?: number | string;
  style?: React.CSSProperties;
};

/** Seconds for one pass of the indeterminate shuttle. */
const SHUTTLE_SECONDS = 1.6;
const SHUTTLE_WIDTH = 0.34;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/**
 * A bar that fills.
 *
 * It lays out inline rather than owning the frame, so it can sit in a card, a
 * row of stats or a render queue — a primitive that fills the composition
 * cannot be composed with anything.
 *
 * The fill decelerates and the leading edge carries its own light, which is
 * what separates progress from a rectangle changing width.
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress = 1,
  from = 0,
  durationInFrames = 60,
  delayInFrames = 0,
  spring: springProp,
  indeterminate = false,
  label,
  showValue = false,
  formatValue,
  segments,
  color = "#e8b86d",
  trackColor = "rgba(255, 255, 255, 0.08)",
  labelColor = "rgba(248, 250, 252, 0.55)",
  height: heightProp,
  radius,
  glow = true,
  width: widthProp = "100%",
  style,
}) => {
  const frame = useCurrentFrame();
  const { width: frameWidth, fps } = useVideoConfig();

  const height = heightProp ?? Math.max(6, scaleFont(12, frameWidth));
  const corner = radius ?? height;
  const labelSize = scaleFont(32, frameWidth);

  const eased = springProp
    ? spring({
        frame,
        fps,
        config: resolveSpringConfig(springProp),
        delay: delayInFrames,
        durationInFrames,
      })
    : interpolate(
        frame,
        [delayInFrames, delayInFrames + durationInFrames],
        [0, 1],
        { easing: EASING_ENTER, ...clamp },
      );

  const value = interpolate(eased, [0, 1], [from, progress], clamp);

  /* The shuttle eases at both ends of its pass, so it reads as a sweep rather
   * than a block sliding at constant speed. */
  const cycle = (frame % (SHUTTLE_SECONDS * fps)) / (SHUTTLE_SECONDS * fps);
  const shuttleLeft =
    interpolate(cycle, [0, 1], [-SHUTTLE_WIDTH, 1], {
      easing: EASING.editorial,
      ...clamp,
    }) * 100;

  const readout = formatValue
    ? formatValue(value)
    : `${Math.round(value * 100)}%`;

  return (
    <div style={{ width: widthProp, ...style }}>
      {label || showValue ? (
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: labelSize,
            marginBottom: height,
            color: labelColor,
            fontSize: labelSize,
            fontWeight: 500,
            letterSpacing: "0.02em",
          }}
        >
          <span>{label}</span>
          {showValue ? (
            <span style={{ fontVariantNumeric: "tabular-nums" }}>
              {indeterminate ? "" : readout}
            </span>
          ) : null}
        </div>
      ) : null}

      <div
        style={{
          position: "relative",
          width: "100%",
          height,
          backgroundColor: trackColor,
          borderRadius: corner,
          overflow: "hidden",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.35)",
        }}
      >
        {indeterminate ? (
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${shuttleLeft}%`,
              width: `${SHUTTLE_WIDTH * 100}%`,
              borderRadius: corner,
              background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
            }}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              width: `${Math.max(0, Math.min(1, value)) * 100}%`,
              borderRadius: corner,
              background: color,
              ...(glow ? { boxShadow: `0 0 ${height * 1.6}px ${color}88` } : {}),
            }}
          >
            {glow ? (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  right: 0,
                  width: height * 2.4,
                  background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.55))`,
                  opacity: value > 0.002 && value < 0.999 ? 1 : 0,
                }}
              />
            ) : null}
          </div>
        )}

        {segments && segments > 1
          ? Array.from({ length: segments - 1 }, (_, index) => (
              <div
                key={`tick-${index}`}
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: `${((index + 1) / segments) * 100}%`,
                  width: Math.max(1, Math.round(height * 0.16)),
                  background: "rgba(0, 0, 0, 0.45)",
                }}
              />
            ))
          : null}
      </div>
    </div>
  );
};
