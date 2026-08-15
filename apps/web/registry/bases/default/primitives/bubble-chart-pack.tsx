import { interpolate, useCurrentFrame } from "remotion";
import {
  formatCompactNumber,
  type ChartDatum,
} from "@/remotion/lib/chart-utils";
import { EASING } from "@/remotion/lib/motion-tokens";

export type BubbleChartPackProps = {
  bubbles: ChartDatum[];
  width?: number;
  height?: number;
  /** Fallback colours, cycled for bubbles that carry no `color`. */
  colors?: string[];
  /** Labels inside bubbles large enough to hold them. */
  showLabels?: boolean;
  /** Values under the labels. */
  showValues?: boolean;
  /** Gap held between neighbouring circles, in layout units. */
  padding?: number;
  inkColor?: string;
  /** Formats the value line. */
  valueFormatter?: (value: number) => string;
  /** Length of one bubble's settle. */
  durationInFrames?: number;
  /** Frames between one bubble and the next, largest first. */
  staggerInFrames?: number;
  delayInFrames?: number;
  /** Frame the exit begins on. Omit to hold once packed. */
  exitAtInFrames?: number;
  /** Length of the exit. */
  exitInFrames?: number;
  /** Frame override — pass the parent frame inside a `<Sequence>`. */
  frame?: number;
};

const DEFAULT_COLORS = ["#e8b86d", "#2dd4bf", "#f472b6", "#8b8bf5", "#f59e0b"];

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

type PackedCircle = { x: number; y: number; radius: number; index: number };

/**
 * Greedy spiral packing.
 *
 * Circles are placed largest first; each one walks out along an Archimedean
 * spiral from the origin until it clears everything already placed. It is not
 * an optimal pack, but it is deterministic and stable — the same data always
 * produces the same arrangement, which matters more here than density, since a
 * layout that reshuffles between renders would make the chart untrustworthy.
 * A compaction pass then pulls everything back toward the centre until it
 * touches, which is what turns the spiral's arms into a cluster.
 */
function packCircles(radii: number[], padding: number): PackedCircle[] {
  const order = radii
    .map((radius, index) => ({ radius, index }))
    .sort((a, b) => b.radius - a.radius);

  const placed: PackedCircle[] = [];

  for (const entry of order) {
    if (placed.length === 0) {
      placed.push({ x: 0, y: 0, radius: entry.radius, index: entry.index });
      continue;
    }

    const step = Math.max(1, entry.radius * 0.12);
    let angle = entry.index * 2.399; // golden angle — avoids stacking one arm
    let distance = step;
    let found = false;

    while (!found && distance < 40_000) {
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      const collides = placed.some((circle) => {
        const gap = Math.hypot(circle.x - x, circle.y - y);
        return gap < circle.radius + entry.radius + padding;
      });

      if (collides) {
        angle += 0.35;
        distance += step * 0.06;
      } else {
        placed.push({ x, y, radius: entry.radius, index: entry.index });
        found = true;
      }
    }
  }

  // The spiral leaves gaps — a circle stops at the first clear spot on its arm,
  // not at the closest one. Pulling every circle back toward the origin until
  // it touches closes them, which is the difference between a pack and a
  // scatter.
  for (let pass = 0; pass < 60; pass += 1) {
    for (const circle of placed) {
      const distance = Math.hypot(circle.x, circle.y);
      if (distance < 0.001) continue;

      const step = Math.min(distance, circle.radius * 0.08);
      const x = circle.x - (circle.x / distance) * step;
      const y = circle.y - (circle.y / distance) * step;
      const blocked = placed.some((other) => {
        if (other === circle) return false;
        return (
          Math.hypot(other.x - x, other.y - y) <
          other.radius + circle.radius + padding
        );
      });

      if (!blocked) {
        circle.x = x;
        circle.y = y;
      }
    }
  }

  return placed;
}

/**
 * Value bubbles packing themselves into a cluster.
 *
 * Radius scales with the square root of the value, so area — which is what the
 * eye compares — stays proportional to the number. Scaling the radius directly
 * would make a bubble worth twice another look four times as big.
 *
 * Bubbles arrive largest first, from the centre outward, so the cluster grows
 * rather than assembling out of unrelated dots.
 */
export const BubbleChartPack: React.FC<BubbleChartPackProps> = ({
  bubbles,
  width = 860,
  height = 520,
  colors = DEFAULT_COLORS,
  showLabels = true,
  showValues = true,
  padding = 6,
  inkColor = "#0b0b10",
  valueFormatter = (value: number) => formatCompactNumber(value),
  durationInFrames = 26,
  staggerInFrames = 7,
  delayInFrames = 0,
  exitAtInFrames,
  exitInFrames = 20,
  frame: frameOverride,
}) => {
  const localFrame = useCurrentFrame();
  const frame = frameOverride ?? localFrame;

  const maxValue = bubbles.reduce(
    (highest, bubble) => Math.max(highest, bubble.value),
    0,
  ) || 1;
  const radii = bubbles.map((bubble) => Math.sqrt(bubble.value / maxValue) * 100);
  const packed = packCircles(radii, padding);

  // The pack is laid out in its own units around the origin, then scaled once
  // to fit the box — so the same data fills the frame at any size.
  const extent = packed.reduce(
    (bounds, circle) => ({
      minX: Math.min(bounds.minX, circle.x - circle.radius),
      maxX: Math.max(bounds.maxX, circle.x + circle.radius),
      minY: Math.min(bounds.minY, circle.y - circle.radius),
      maxY: Math.max(bounds.maxY, circle.y + circle.radius),
    }),
    { minX: 0, maxX: 0, minY: 0, maxY: 0 },
  );
  const spanX = Math.max(1, extent.maxX - extent.minX);
  const spanY = Math.max(1, extent.maxY - extent.minY);
  const scale = Math.min(width / spanX, height / spanY) * 0.96;
  const centreX = (extent.minX + extent.maxX) / 2;
  const centreY = (extent.minY + extent.maxY) / 2;

  const arrival = new Map(packed.map((circle, rank) => [circle.index, rank]));

  const exit =
    exitAtInFrames === undefined
      ? 0
      : interpolate(frame, [exitAtInFrames, exitAtInFrames + exitInFrames], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASING.exit,
        });

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {packed.map((circle) => {
        const datum = bubbles[circle.index];
        const rank = arrival.get(circle.index) ?? 0;
        const start = delayInFrames + rank * staggerInFrames;
        const progress = interpolate(
          frame,
          [start, start + durationInFrames],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASING.pop },
        );
        // Smallest bubbles leave first, so the cluster contracts back to its
        // heaviest value instead of collapsing all at once.
        const drain = clamp01(
          (exit - (1 - rank / Math.max(1, packed.length)) * 0.25) / 0.75,
        );
        const shown = clamp01(progress) * (1 - drain);
        if (shown <= 0) return null;

        // Bubbles travel out from the centre of the cluster as they grow.
        const restX = width / 2 + (circle.x - centreX) * scale;
        const restY = height / 2 + (circle.y - centreY) * scale;
        const x = width / 2 + (restX - width / 2) * clamp01(progress);
        const y = height / 2 + (restY - height / 2) * clamp01(progress);
        const radius = circle.radius * scale * shown;
        const colour = datum.color ?? colors[circle.index % colors.length];
        const labelSize = radius * 0.3;

        return (
          <g key={datum.label}>
            <circle cx={x} cy={y} r={radius} fill={colour} opacity={0.92} />
            {showLabels && labelSize > 8 ? (
              <text
                x={x}
                y={showValues ? y - labelSize * 0.5 : y}
                fill={inkColor}
                fontSize={labelSize}
                fontWeight={700}
                textAnchor="middle"
                dominantBaseline="central"
              >
                {datum.label}
              </text>
            ) : null}
            {showValues && labelSize > 12 ? (
              <text
                x={x}
                y={y + labelSize * 0.75}
                fill={inkColor}
                fontSize={labelSize * 0.82}
                fontWeight={600}
                textAnchor="middle"
                dominantBaseline="central"
                opacity={0.7}
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {valueFormatter(datum.value)}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
};
