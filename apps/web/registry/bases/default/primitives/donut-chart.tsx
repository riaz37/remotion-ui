import { interpolate, useCurrentFrame } from "remotion";
import {
  formatCompactNumber,
  type ChartDatum,
} from "@/remotion/lib/chart-utils";
import { EASING } from "@/remotion/lib/motion-tokens";

export type DonutChartProps = {
  segments: ChartDatum[];
  /** Outer diameter of the ring, in pixels. */
  size?: number;
  /** Ring thickness. Below about a tenth of `size` it reads as a hairline. */
  thickness?: number;
  /** Fallback colours, cycled for segments that carry no `color`. */
  colors?: string[];
  /** Legend rows beside the ring, one per segment. */
  showLegend?: boolean;
  /** Total in the hole, counting up as the ring fills. */
  showTotal?: boolean;
  /** Caption under the total. */
  totalLabel?: string;
  /** Formats the centre total and the legend values. */
  valueFormatter?: (value: number) => string;
  trackColor?: string;
  labelColor?: string;
  inkColor?: string;
  /** Length of one segment's sweep. Segments overlap by design. */
  durationInFrames?: number;
  /** Frames between the start of one segment and the next. */
  staggerInFrames?: number;
  delayInFrames?: number;
  /** Frame the exit begins on. Omit to hold once filled. */
  exitAtInFrames?: number;
  /** Length of the exit. */
  exitInFrames?: number;
  /** Frame override — pass the parent frame inside a `<Sequence>`. */
  frame?: number;
};

const DEFAULT_COLORS = ["#e8b86d", "#2dd4bf", "#f472b6", "#8b8bf5"];

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/**
 * Multi-segment donut whose slices sweep on one after another.
 *
 * The ring is drawn as one `<circle>` per segment, each rotated to its own
 * start angle and revealed by its dash offset. Arc paths would need their own
 * large-arc bookkeeping and lose the round caps; a dashed stroke gets both for
 * free and keeps every segment on the same radius, so nothing drifts as the
 * sweep runs.
 *
 * The centre total counts the segments that have actually landed rather than
 * the grand total scaled by progress — the number and the ring then agree at
 * every frame instead of only at the end.
 */
export const DonutChart: React.FC<DonutChartProps> = ({
  segments,
  size = 360,
  thickness = 46,
  colors = DEFAULT_COLORS,
  showLegend = true,
  showTotal = true,
  totalLabel = "Total",
  valueFormatter = (value: number) => formatCompactNumber(value),
  trackColor = "rgba(250,250,250,0.08)",
  labelColor = "rgba(250,250,250,0.58)",
  inkColor = "#fafafa",
  durationInFrames = 26,
  staggerInFrames = 9,
  delayInFrames = 0,
  exitAtInFrames,
  exitInFrames = 20,
  frame: frameOverride,
}) => {
  const localFrame = useCurrentFrame();
  const frame = frameOverride ?? localFrame;

  const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  // A fixed pixel gap keeps thin slices from touching their neighbours without
  // eating a visible share of a wide one.
  const gap = Math.min(circumference * 0.012, thickness * 0.22);

  const exit =
    exitAtInFrames === undefined
      ? 0
      : interpolate(frame, [exitAtInFrames, exitAtInFrames + exitInFrames], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASING.exit,
        });

  let cumulative = 0;
  const drawn = segments.map((segment, index) => {
    const start = cumulative;
    const fraction = segment.value / total;
    cumulative += fraction;

    const progress = interpolate(
      frame,
      [
        delayInFrames + index * staggerInFrames,
        delayInFrames + index * staggerInFrames + durationInFrames,
      ],
      [0, 1],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASING.enter },
    );

    return {
      ...segment,
      start,
      fraction,
      progress,
      color: segment.color ?? colors[index % colors.length],
    };
  });

  const landed = drawn.reduce(
    (sum, segment) => sum + segment.value * segment.progress,
    0,
  );

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: size * 0.16,
        // The exit dismisses the whole chart rather than unwinding the sweep:
        // a ring that retracts reads as data being withdrawn.
        opacity: 1 - clamp01(exit / 0.7),
        transform: `scale(${1 - exit * 0.06})`,
      }}
    >
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth={thickness}
          />
          {drawn.map((segment) => {
            const length = Math.max(
              0,
              segment.fraction * circumference * segment.progress - gap,
            );

            return (
              <circle
                key={segment.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth={thickness}
                strokeLinecap="butt"
                strokeDasharray={`${length} ${circumference}`}
                // −90° puts the first segment at twelve o'clock; the rotation
                // is applied about the centre so every segment shares a radius.
                transform={`rotate(${-90 + segment.start * 360} ${size / 2} ${size / 2})`}
              />
            );
          })}
        </svg>

        {showTotal ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              textAlign: "center",
            }}
          >
            <div>
              <div
                style={{
                  color: inkColor,
                  fontSize: size * 0.17,
                  fontWeight: 700,
                  lineHeight: 1,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {valueFormatter(landed)}
              </div>
              <div
                style={{
                  color: labelColor,
                  fontSize: size * 0.065,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  marginTop: size * 0.03,
                }}
              >
                {totalLabel}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {showLegend ? (
        <div style={{ display: "grid", gap: size * 0.055 }}>
          {drawn.map((segment) => (
            <div
              key={segment.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: size * 0.045,
                // Each row arrives with its own slice, so the legend reads as
                // a running commentary instead of a caption bolted on at the end.
                opacity: clamp01(segment.progress * 1.6),
                transform: `translateX(${(1 - segment.progress) * size * 0.05}px)`,
              }}
            >
              <span
                style={{
                  width: size * 0.05,
                  height: size * 0.05,
                  borderRadius: 999,
                  background: segment.color,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  color: inkColor,
                  fontSize: size * 0.062,
                  fontWeight: 600,
                  minWidth: size * 0.42,
                }}
              >
                {segment.label}
              </span>
              <span
                style={{
                  color: labelColor,
                  fontSize: size * 0.062,
                  fontWeight: 600,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {Math.round(segment.fraction * segment.progress * 100)}%
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};
