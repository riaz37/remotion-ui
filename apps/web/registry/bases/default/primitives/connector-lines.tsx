import { interpolate, useCurrentFrame } from "remotion";
import { EASING } from "@/remotion/lib/motion-tokens";

export type ConnectorAnchor = {
  /** Name the edges refer to. */
  id: string;
  /** Position as a fraction of the box, so anchors survive a resize. */
  x: number;
  y: number;
};

export type ConnectorEdge = {
  from: string;
  to: string;
  /**
   * How the line gets there. `curve` bows toward the midpoint's normal,
   * `elbow` turns once at right angles, `straight` goes direct.
   */
  shape?: "curve" | "elbow" | "straight";
  /** Bow of a curved edge, as a fraction of the distance. Negative flips it. */
  bow?: number;
  color?: string;
  /** Draws a dot where the line meets the target. */
  dot?: boolean;
};

export type ConnectorLinesProps = {
  anchors?: ConnectorAnchor[];
  edges?: ConnectorEdge[];
  width?: number;
  height?: number;
  stroke?: string;
  strokeWidth?: number;
  /** Dashes every edge. Useful when the lines are a relationship, not a flow. */
  dashed?: boolean;
  /** Frames to wait before the first edge draws. */
  delayInFrames?: number;
  /** Frames one edge takes to draw. */
  durationInFrames?: number;
  /** Frames between edges. */
  staggerInFrames?: number;
  /** Frame the lines start leaving. Omit to leave them on screen. */
  exitAtInFrames?: number;
  /** Frames the exit takes. */
  exitInFrames?: number;
};

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const DEFAULT_ANCHORS: ConnectorAnchor[] = [
  { id: "source", x: 0.12, y: 0.5 },
  { id: "parse", x: 0.44, y: 0.18 },
  { id: "render", x: 0.44, y: 0.82 },
  { id: "output", x: 0.86, y: 0.5 },
];

const DEFAULT_EDGES: ConnectorEdge[] = [
  { from: "source", to: "parse", shape: "curve", bow: 0.12, dot: true },
  { from: "source", to: "render", shape: "curve", bow: -0.12, dot: true },
  { from: "parse", to: "output", shape: "curve", bow: 0.12, dot: true },
  { from: "render", to: "output", shape: "curve", bow: -0.12, dot: true },
];

/**
 * The edges between anchored elements, and nothing else.
 *
 * This is the primitive under a diagram, not the diagram: it draws lines
 * between named points and leaves the boxes to whatever you position on top at
 * the same fractional coordinates. Anchors are fractions rather than pixels for
 * exactly that reason — the same anchor table drives the lines and the layout,
 * at any size.
 *
 * Edges draw in order with a stagger, each on its own `pathLength={1}`, so a
 * long curve and a short hop take the same time and the diagram assembles at an
 * even pace.
 */
export const ConnectorLines: React.FC<ConnectorLinesProps> = ({
  anchors = DEFAULT_ANCHORS,
  edges = DEFAULT_EDGES,
  width = 420,
  height = 240,
  stroke = "#E8B86D",
  strokeWidth = 2,
  dashed = false,
  delayInFrames = 0,
  durationInFrames = 26,
  staggerInFrames = 10,
  exitAtInFrames,
  exitInFrames = 16,
}) => {
  const frame = useCurrentFrame();

  const find = (id: string) => anchors.find((anchor) => anchor.id === id);

  const exit =
    exitAtInFrames === undefined
      ? 0
      : interpolate(frame, [exitAtInFrames, exitAtInFrames + exitInFrames], [0, 1], {
          easing: EASING.exit,
          ...clamp,
        });

  const pathFor = (edge: ConnectorEdge) => {
    const from = find(edge.from);
    const to = find(edge.to);
    // An edge naming an anchor that does not exist is dropped rather than
    // drawn to the origin, which would be a line to the corner of the box.
    if (!from || !to) return null;

    const x1 = from.x * width;
    const y1 = from.y * height;
    const x2 = to.x * width;
    const y2 = to.y * height;

    if (edge.shape === "straight") {
      return { d: `M ${x1} ${y1} L ${x2} ${y2}`, x2, y2 };
    }
    if (edge.shape === "elbow") {
      const midX = (x1 + x2) / 2;
      return { d: `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`, x2, y2 };
    }

    // Control point on the segment's own normal, so the bow stays proportional
    // whatever the edge's length or angle.
    const dx = x2 - x1;
    const dy = y2 - y1;
    const bow = edge.bow ?? 0.16;
    const cx = (x1 + x2) / 2 - dy * bow;
    const cy = (y1 + y2) / 2 + dx * bow;
    return { d: `M ${x1} ${y1} Q ${cx} ${cy}, ${x2} ${y2}`, x2, y2 };
  };

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ overflow: "visible", opacity: 1 - exit }}
    >
      {edges.map((edge, index) => {
        const geometry = pathFor(edge);
        if (!geometry) return null;

        const start = delayInFrames + index * staggerInFrames;
        const draw = interpolate(frame, [start, start + durationInFrames], [0, 1], {
          easing: EASING.editorial,
          ...clamp,
        });
        if (draw <= 0) return null;
        const color = edge.color ?? stroke;

        return (
          <g key={`${edge.from}-${edge.to}-${index}`}>
            <path
              d={geometry.d}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.85}
              pathLength={1}
              strokeDasharray={dashed ? "0.02 0.02" : 1}
              strokeDashoffset={dashed ? 0 : 1 - draw}
              // A dashed edge cannot use the dash array to reveal itself, so it
              // fades in over the same frames the solid one would draw.
              style={dashed ? { opacity: draw * 0.85 } : undefined}
            />
            {edge.dot ? (
              <circle
                cx={geometry.x2}
                cy={geometry.y2}
                r={strokeWidth * 1.8}
                fill={color}
                // The dot is the arrival, so it appears as the line lands
                // rather than waiting for it to settle.
                opacity={interpolate(draw, [0.85, 1], [0, 1], clamp)}
              />
            ) : null}
          </g>
        );
      })}
    </svg>
  );
};
