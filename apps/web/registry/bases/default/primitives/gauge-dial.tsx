import { interpolate, useCurrentFrame } from "remotion";
import { EASING } from "@/remotion/lib/motion-tokens";

export type GaugeDialProps = {
  /** Target the needle sweeps to. */
  value: number;
  min?: number;
  max?: number;
  /** Outer diameter, in pixels. */
  size?: number;
  /** Track and fill thickness. */
  thickness?: number;
  /** Total sweep of the dial in degrees, centred on twelve o'clock. */
  sweepInDegrees?: number;
  color?: string;
  trackColor?: string;
  inkColor?: string;
  labelColor?: string;
  /** Caption under the readout. */
  label?: string;
  /** Suffix on the readout, e.g. `"%"` or `" ms"`. */
  unit?: string;
  /** Tick marks around the arc. `0` hides them. */
  tickCount?: number;
  /** Formats the readout. Defaults to a rounded integer. */
  valueFormatter?: (value: number) => string;
  durationInFrames?: number;
  delayInFrames?: number;
  /** Frame the exit begins on. Omit to hold at the target. */
  exitAtInFrames?: number;
  /** Length of the exit. */
  exitInFrames?: number;
  /** Frame override — pass the parent frame inside a `<Sequence>`. */
  frame?: number;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

function polar(cx: number, cy: number, radius: number, degrees: number) {
  const radians = ((degrees - 90) * Math.PI) / 180;
  return { x: cx + radius * Math.cos(radians), y: cy + radius * Math.sin(radians) };
}

/** Open arc between two angles, drawn as a stroke rather than a wedge. */
function arcPath(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
): string {
  if (endAngle - startAngle <= 0.001) return "";
  const start = polar(cx, cy, radius, startAngle);
  const end = polar(cx, cy, radius, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

/**
 * A dial whose needle sweeps to its target.
 *
 * The needle uses the overshoot curve and the fill arc does not: a needle that
 * settles back is instrument-like, while a coloured arc that retreats reads as
 * the value itself changing its mind. The readout counts from the same eased
 * progress as the arc, so number and arc always agree.
 */
export const GaugeDial: React.FC<GaugeDialProps> = ({
  value,
  min = 0,
  max = 100,
  size = 360,
  thickness = 26,
  sweepInDegrees = 250,
  color = "#e8b86d",
  trackColor = "rgba(250,250,250,0.10)",
  inkColor = "#fafafa",
  labelColor = "rgba(250,250,250,0.58)",
  label,
  unit = "",
  tickCount = 9,
  valueFormatter = (input: number) => String(Math.round(input)),
  durationInFrames = 44,
  delayInFrames = 0,
  exitAtInFrames,
  exitInFrames = 20,
  frame: frameOverride,
}) => {
  const localFrame = useCurrentFrame();
  const frame = frameOverride ?? localFrame;

  const centre = size / 2;
  const radius = (size - thickness) / 2;
  const startAngle = -sweepInDegrees / 2;
  const endAngle = sweepInDegrees / 2;

  const span = max - min || 1;
  const target = clamp01((value - min) / span);

  const enterWindow: [number, number] = [
    delayInFrames,
    delayInFrames + durationInFrames,
  ];
  const arcProgress = interpolate(frame, enterWindow, [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASING.enter,
  });
  const needleProgress = interpolate(frame, enterWindow, [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASING.pop,
  });

  const exit =
    exitAtInFrames === undefined
      ? 0
      : interpolate(frame, [exitAtInFrames, exitAtInFrames + exitInFrames], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASING.exit,
        });

  // The exit unwinds the dial back to its rest position — an instrument
  // powering down, rather than the panel dissolving where it stands.
  const arcFraction = target * arcProgress * (1 - exit);
  const needleFraction = target * needleProgress * (1 - exit);
  const needleAngle = startAngle + needleFraction * sweepInDegrees;
  const needleTip = polar(centre, centre, radius - thickness * 0.55, needleAngle);
  const needleTail = polar(centre, centre, thickness * 0.5, needleAngle + 180);

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        opacity: 1 - clamp01(exit / 0.85),
      }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <path
          d={arcPath(centre, centre, radius, startAngle, endAngle)}
          fill="none"
          stroke={trackColor}
          strokeWidth={thickness}
          strokeLinecap="round"
        />
        <path
          d={arcPath(
            centre,
            centre,
            radius,
            startAngle,
            startAngle + arcFraction * sweepInDegrees,
          )}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
        />

        {tickCount > 0
          ? Array.from({ length: tickCount }, (_, index) => {
              const fraction = index / (tickCount - 1);
              const angle = startAngle + fraction * sweepInDegrees;
              const outer = polar(centre, centre, radius - thickness * 0.72, angle);
              const inner = polar(centre, centre, radius - thickness * 1.05, angle);
              // Ticks the needle has already passed sit brighter, so the dial
              // carries its reading even where the arc is hidden behind it.
              const passed = fraction <= needleFraction;

              return (
                <line
                  key={angle}
                  x1={inner.x}
                  y1={inner.y}
                  x2={outer.x}
                  y2={outer.y}
                  stroke={passed ? inkColor : labelColor}
                  strokeWidth={size * 0.007}
                  strokeLinecap="round"
                  opacity={passed ? 0.85 : 0.35}
                />
              );
            })
          : null}

        <line
          x1={needleTail.x}
          y1={needleTail.y}
          x2={needleTip.x}
          y2={needleTip.y}
          stroke={inkColor}
          strokeWidth={size * 0.018}
          strokeLinecap="round"
        />
        <circle cx={centre} cy={centre} r={size * 0.038} fill={inkColor} />
        <circle cx={centre} cy={centre} r={size * 0.016} fill={color} />
      </svg>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: size * 0.62,
          textAlign: "center",
        }}
      >
        <div
          style={{
            color: inkColor,
            fontSize: size * 0.14,
            fontWeight: 700,
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {valueFormatter(min + span * arcFraction)}
          {unit}
        </div>
        {label ? (
          <div
            style={{
              color: labelColor,
              fontSize: size * 0.055,
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginTop: size * 0.028,
            }}
          >
            {label}
          </div>
        ) : null}
      </div>
    </div>
  );
};
