import { useId, useMemo, type CSSProperties } from "react";
import { interpolateColors, useCurrentFrame, useVideoConfig } from "remotion";
import { resolveAnimatable, type Animatable } from "@/remotion/lib/ae-motion";
import { toD } from "@/remotion/lib/bezier-path";
import {
  evaluateShapeStack,
  type ShapeOperator,
  type ShapeSource,
} from "@/remotion/lib/shape-ops";

export type {
  OffsetOp,
  PuckerBloatOp,
  RepeaterOp,
  ShapeOperator,
  ShapeSource,
  TransformOp,
  TrimOp,
  WiggleOp,
  ZigZagOp,
} from "@/remotion/lib/shape-ops";

export type ShapeLayerProps = {
  /** Shapes at the top of the layer, merged into one geometry list. */
  shapes: ShapeSource[];
  /**
   * The operator stack, run top to bottom. Each operator sees everything the
   * ones above it produced, so reordering the list changes the result.
   */
  operators?: ShapeOperator[];
  /** Rendered size in pixels. Shape coordinates are in the same units. */
  width?: number;
  height?: number;
  /** `center` puts (0, 0) in the middle of the layer, like a centred anchor. */
  origin?: "center" | "top-left";
  stroke?: string | null;
  /** Colour the last repeater copy fades to. Omit for a single colour. */
  strokeEnd?: string;
  strokeWidth?: Animatable<number>;
  fill?: string | null;
  /** Colour the last repeater copy's fill fades to. */
  fillEnd?: string;
  lineCap?: "butt" | "round" | "square";
  lineJoin?: "miter" | "round" | "bevel";
  /** Soft bloom radius in pixels. 0 turns it off. */
  glow?: number;
  /** Render a specific frame instead of the current one (e.g. a Sequence parent). */
  frame?: number;
  style?: CSSProperties;
  className?: string;
};

/**
 * An After Effects shape layer: shapes plus an ordered operator stack — Trim
 * Paths, Repeater, Offset Paths, Wiggle Paths, Zig Zag, Pucker & Bloat and
 * Transform — evaluated per frame as pure geometry.
 *
 * Every parameter is `Animatable`: a number, a keyframe track from
 * `ae-motion`, or an expression `({ frame, time, fps }) => value`.
 */
export const ShapeLayer: React.FC<ShapeLayerProps> = ({
  shapes,
  operators = [],
  width = 400,
  height = 400,
  origin = "center",
  stroke = "#e8b86d",
  strokeEnd,
  strokeWidth = 3,
  fill = null,
  fillEnd,
  lineCap = "round",
  lineJoin = "round",
  glow = 0,
  frame: frameOverride,
  style,
  className,
}) => {
  const currentFrame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const frame = frameOverride ?? currentFrame;
  // SVG ids are document-global; two layers on one frame must not share a filter.
  const filterId = `shape-layer-glow-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const items = useMemo(
    () => evaluateShapeStack({ shapes, operators, frame, fps }),
    [shapes, operators, frame, fps],
  );
  const strokePx = resolveAnimatable(strokeWidth, frame, { fps });

  const viewBox =
    origin === "center"
      ? `${-width / 2} ${-height / 2} ${width} ${height}`
      : `0 0 ${width} ${height}`;
  const [vx, vy] = origin === "center" ? [-width / 2, -height / 2] : [0, 0];

  const ramp = (from: string | null, to: string | undefined, copy: number, copies: number) => {
    if (!from) return "none";
    if (!to || copies <= 1) return from;
    return interpolateColors(copy / (copies - 1), [0, 1], [from, to]);
  };

  return (
    <svg
      width={width}
      height={height}
      viewBox={viewBox}
      className={className}
      style={{ overflow: "visible", ...style }}
    >
      {glow > 0 ? (
        <defs>
          <filter
            id={filterId}
            filterUnits="userSpaceOnUse"
            x={vx - glow * 3}
            y={vy - glow * 3}
            width={width + glow * 6}
            height={height + glow * 6}
          >
            <feGaussianBlur stdDeviation={glow} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      ) : null}
      <g filter={glow > 0 ? `url(#${filterId})` : undefined}>
        {items.map((item, index) => {
          const d = toD(item.path);
          if (!d || item.opacity <= 0) return null;
          return (
            <path
              // Items are rebuilt every frame and have no identity beyond order.
              key={index}
              d={d}
              opacity={Math.min(1, item.opacity)}
              fill={ramp(fill, fillEnd, item.copy, item.copies)}
              stroke={ramp(stroke, strokeEnd, item.copy, item.copies)}
              strokeWidth={stroke ? strokePx : 0}
              strokeLinecap={lineCap}
              strokeLinejoin={lineJoin}
            />
          );
        })}
      </g>
    </svg>
  );
};
