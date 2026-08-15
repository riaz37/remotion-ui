import { interpolate, useCurrentFrame } from "remotion";
import type { ChartDatum } from "@/remotion/lib/chart-utils";
import { EASING } from "@/remotion/lib/motion-tokens";

export type PieSliceRevealProps = {
  slices: ChartDatum[];
  /** Diameter of the pie, in pixels. */
  size?: number;
  /** Fallback colours, cycled for slices that carry no `color`. */
  colors?: string[];
  /** Percentage labels inside each slice. */
  showLabels?: boolean;
  /** How far each slice sits off centre, as a share of the radius. */
  explode?: number;
  /** Angular gap between slices, in degrees. */
  gapInDegrees?: number;
  labelColor?: string;
  /** Length of one slice's sweep. */
  durationInFrames?: number;
  /** Frames between the start of one slice and the next. */
  staggerInFrames?: number;
  delayInFrames?: number;
  /** Frame the exit begins on. Omit to hold once complete. */
  exitAtInFrames?: number;
  /** Length of the exit. */
  exitInFrames?: number;
  /** Frame override — pass the parent frame inside a `<Sequence>`. */
  frame?: number;
};

const DEFAULT_COLORS = ["#e8b86d", "#2dd4bf", "#f472b6", "#8b8bf5", "#f59e0b"];

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** Cartesian point on a circle, measured clockwise from twelve o'clock. */
function polar(cx: number, cy: number, radius: number, degrees: number) {
  const radians = ((degrees - 90) * Math.PI) / 180;
  return { x: cx + radius * Math.cos(radians), y: cy + radius * Math.sin(radians) };
}

/** Filled wedge from `startAngle` to `endAngle`, both in degrees. */
function wedgePath(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
): string {
  const sweep = endAngle - startAngle;
  if (sweep <= 0) return "";
  // A full circle has no distinct start and end point, so it is drawn as two
  // half arcs — one arc command would collapse to nothing.
  if (sweep >= 359.999) {
    const top = polar(cx, cy, radius, 0);
    const bottom = polar(cx, cy, radius, 180);
    return `M ${top.x} ${top.y} A ${radius} ${radius} 0 1 1 ${bottom.x} ${bottom.y} A ${radius} ${radius} 0 1 1 ${top.x} ${top.y} Z`;
  }
  const start = polar(cx, cy, radius, startAngle);
  const end = polar(cx, cy, radius, endAngle);
  const largeArc = sweep > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
}

/**
 * Slices that sweep in one after another, clockwise from twelve o'clock.
 *
 * Each slice owns its own sweep window, so the chart is read in the order the
 * data is given rather than appearing all at once. The angular gap is taken off
 * the end of every wedge instead of being drawn as a separate stroke: a stroked
 * divider would sit on top of whichever slice was painted last and break the
 * ring's outer edge.
 */
export const PieSliceReveal: React.FC<PieSliceRevealProps> = ({
  slices,
  size = 380,
  colors = DEFAULT_COLORS,
  showLabels = true,
  explode = 0.04,
  gapInDegrees = 1.4,
  labelColor = "#0b0b10",
  durationInFrames = 24,
  staggerInFrames = 14,
  delayInFrames = 0,
  exitAtInFrames,
  exitInFrames = 20,
  frame: frameOverride,
}) => {
  const localFrame = useCurrentFrame();
  const frame = frameOverride ?? localFrame;

  const total = slices.reduce((sum, slice) => sum + slice.value, 0) || 1;
  // The exploded offset pushes wedges outward, so the pie is drawn smaller
  // than the box it is given — otherwise the offset clips at the viewBox edge.
  const radius = (size / 2) * (1 - explode * 1.6);
  const centre = size / 2;

  const exit =
    exitAtInFrames === undefined
      ? 0
      : interpolate(frame, [exitAtInFrames, exitAtInFrames + exitInFrames], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASING.exit,
        });

  let cumulative = 0;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ overflow: "visible", opacity: 1 - clamp01(exit / 0.7) }}
    >
      {slices.map((slice, index) => {
        const startAngle = cumulative * 360;
        const span = (slice.value / total) * 360;
        cumulative += slice.value / total;

        const progress = interpolate(
          frame,
          [
            delayInFrames + index * staggerInFrames,
            delayInFrames + index * staggerInFrames + durationInFrames,
          ],
          [0, 1],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: EASING.enter,
          },
        );

        if (progress <= 0) return null;

        const swept = Math.max(0, span * progress - gapInDegrees);
        const midAngle = startAngle + swept / 2;
        // Slices ride outward on their own bisector — during the sweep the
        // bisector is still moving, so the wedge slides as it opens.
        const offsetDistance = radius * explode * progress + radius * explode * exit * 5;
        const offset = polar(0, 0, offsetDistance, midAngle);
        const colour = slice.color ?? colors[index % colors.length];
        const label = polar(0, 0, radius * 0.66, midAngle);

        return (
          <g key={slice.label} transform={`translate(${offset.x} ${offset.y})`}>
            <path
              d={wedgePath(centre, centre, radius, startAngle, startAngle + swept)}
              fill={colour}
            />
            {showLabels && progress > 0.7 ? (
              <text
                x={centre + label.x}
                y={centre + label.y}
                fill={labelColor}
                fontSize={size * 0.058}
                fontWeight={700}
                textAnchor="middle"
                dominantBaseline="central"
                opacity={clamp01((progress - 0.7) / 0.3)}
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {Math.round((slice.value / total) * 100)}%
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
};
