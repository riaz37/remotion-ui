import { interpolate, useCurrentFrame } from "remotion";
import { EASING } from "@/remotion/lib/motion-tokens";

export type RadarSeries = {
  label: string;
  /** One value per axis, in the same order as `axes`. */
  values: number[];
  color?: string;
};

export type RadarChartProps = {
  /** Axis names, clockwise from the top. */
  axes: string[];
  series: RadarSeries[];
  /** Outer diameter of the web, axis labels excluded. */
  size?: number;
  /** Top of every axis. Defaults to the largest value present. */
  maxValue?: number;
  colors?: string[];
  /** Concentric rings drawn behind the polygons. */
  ringCount?: number;
  gridColor?: string;
  labelColor?: string;
  /** Axis names around the web. */
  showLabels?: boolean;
  /** Dot on each vertex. */
  showVertices?: boolean;
  /** Fill opacity under each polygon. */
  fillOpacity?: number;
  /** Length of one vertex's reach. */
  durationInFrames?: number;
  /** Frames between one axis and the next, sweeping clockwise. */
  staggerInFrames?: number;
  /** Frames one series trails the previous one by. */
  seriesOffsetInFrames?: number;
  delayInFrames?: number;
  /** Frame the exit begins on. Omit to hold once drawn. */
  exitAtInFrames?: number;
  /** Length of the exit. */
  exitInFrames?: number;
  /** Frame override — pass the parent frame inside a `<Sequence>`. */
  frame?: number;
};

const DEFAULT_COLORS = ["#e8b86d", "#2dd4bf", "#f472b6"];

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/**
 * A spider chart whose polygon reaches out one axis at a time.
 *
 * Vertices are staggered clockwise rather than scaled as one shape. A polygon
 * that simply scales up says nothing about which axis is strong; reaching axis
 * by axis makes the shape assemble in the order the labels are read, and the
 * silhouette only resolves once the last vertex lands.
 *
 * The web behind it — rings and spokes — arrives first and whole. It is the
 * measuring instrument, not part of the data, so animating it would suggest the
 * scale itself was changing.
 */
export const RadarChart: React.FC<RadarChartProps> = ({
  axes,
  series,
  size = 420,
  maxValue,
  colors = DEFAULT_COLORS,
  ringCount = 4,
  gridColor = "rgba(250,250,250,0.14)",
  labelColor = "rgba(250,250,250,0.6)",
  showLabels = true,
  showVertices = true,
  fillOpacity = 0.22,
  durationInFrames = 18,
  staggerInFrames = 5,
  seriesOffsetInFrames = 10,
  delayInFrames = 0,
  exitAtInFrames,
  exitInFrames = 20,
  frame: frameOverride,
}) => {
  const localFrame = useCurrentFrame();
  const frame = frameOverride ?? localFrame;

  const axisCount = Math.max(3, axes.length);
  const largest = series.reduce(
    (highest, entry) =>
      entry.values.reduce((rowMax, value) => Math.max(rowMax, value), highest),
    0,
  );
  const peak = maxValue ?? (largest || 1);

  const labelSize = Math.max(11, size * 0.045);
  // Labels sit outside the web, so the box has to hold the longest of them —
  // a fixed margin clips "Type safety" while wasting space on "Docs".
  const longestLabel = axes.reduce(
    (longest, label) => Math.max(longest, label.length),
    0,
  );
  const margin = showLabels
    ? labelSize * 1.6 + longestLabel * labelSize * 0.52
    : labelSize;
  const box = size + margin * 2;
  const centre = box / 2;
  const radius = size / 2;

  const point = (axisIndex: number, distance: number) => {
    const angle = (axisIndex / axisCount) * Math.PI * 2 - Math.PI / 2;
    return {
      x: centre + Math.cos(angle) * distance,
      y: centre + Math.sin(angle) * distance,
    };
  };

  const exit =
    exitAtInFrames === undefined
      ? 0
      : interpolate(frame, [exitAtInFrames, exitAtInFrames + exitInFrames], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASING.exit,
        });

  const webOpacity =
    interpolate(frame, [delayInFrames, delayInFrames + 12], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASING.enter,
    }) * (1 - clamp01(exit / 0.7));

  return (
    <svg width={box} height={box} viewBox={`0 0 ${box} ${box}`}>
      <g opacity={webOpacity}>
        {Array.from({ length: ringCount }, (_, ring) => {
          const ringRadius = (radius * (ring + 1)) / ringCount;
          const path = Array.from({ length: axisCount }, (_, axis) => {
            const position = point(axis, ringRadius);
            return `${axis === 0 ? "M" : "L"} ${position.x} ${position.y}`;
          }).join(" ");

          return (
            <path
              key={ring}
              d={`${path} Z`}
              fill="none"
              stroke={gridColor}
              strokeWidth={1}
              // The outermost ring carries the scale, so it reads heavier.
              opacity={ring === ringCount - 1 ? 1.6 : 1}
            />
          );
        })}

        {Array.from({ length: axisCount }, (_, axis) => {
          const outer = point(axis, radius);
          return (
            <line
              key={axis}
              x1={centre}
              y1={centre}
              x2={outer.x}
              y2={outer.y}
              stroke={gridColor}
              strokeWidth={1}
            />
          );
        })}

        {showLabels
          ? axes.map((label, axis) => {
              const anchorPoint = point(axis, radius + labelSize * 1.3);
              const horizontal = anchorPoint.x - centre;
              return (
                <text
                  key={label}
                  x={anchorPoint.x}
                  y={anchorPoint.y}
                  fill={labelColor}
                  fontSize={labelSize}
                  fontWeight={600}
                  // Labels anchor away from the centre, so a long name on the
                  // left never runs back across the web.
                  textAnchor={
                    Math.abs(horizontal) < 1
                      ? "middle"
                      : horizontal > 0
                        ? "start"
                        : "end"
                  }
                  dominantBaseline="central"
                >
                  {label}
                </text>
              );
            })
          : null}
      </g>

      {series.map((entry, seriesIndex) => {
        const colour = entry.color ?? colors[seriesIndex % colors.length];
        const seriesStart =
          delayInFrames + 8 + seriesIndex * seriesOffsetInFrames;

        const reached = Array.from({ length: axisCount }, (_, axis) => {
          const value = entry.values[axis] ?? 0;
          const start = seriesStart + axis * staggerInFrames;
          const progress = interpolate(
            frame,
            [start, start + durationInFrames],
            [0, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: EASING.pop,
            },
          );
          // The polygon collapses back to the centre on the way out.
          const distance = (value / peak) * radius * clamp01(progress) * (1 - exit);
          return { ...point(axis, distance), progress };
        });

        const path = reached
          .map((vertex, axis) => `${axis === 0 ? "M" : "L"} ${vertex.x} ${vertex.y}`)
          .join(" ");

        return (
          <g key={entry.label}>
            <path
              d={`${path} Z`}
              fill={colour}
              fillOpacity={fillOpacity * (1 - clamp01(exit / 0.8))}
              stroke={colour}
              strokeWidth={Math.max(2, size * 0.008)}
              strokeLinejoin="round"
              opacity={1 - clamp01(exit / 0.85)}
            />
            {showVertices
              ? reached.map((vertex, axis) => (
                  <circle
                    key={axis}
                    cx={vertex.x}
                    cy={vertex.y}
                    r={Math.max(2, size * 0.012) * clamp01(vertex.progress)}
                    fill={colour}
                    opacity={1 - clamp01(exit / 0.85)}
                  />
                ))
              : null}
          </g>
        );
      })}
    </svg>
  );
};
