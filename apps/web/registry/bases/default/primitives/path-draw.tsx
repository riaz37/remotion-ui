import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { EASING } from "@/remotion/lib/motion-tokens";
import {
  clampProgress,
  fitViewBox,
  getPathDrawStyles,
  samplePath,
} from "@/remotion/lib/path-utils";

export type PathDrawProps = {
  /** One path, or several drawn in order with `staggerInFrames` between them. */
  d: string | string[];
  durationInFrames?: number;
  delayInFrames?: number;
  /** Offset between the start of each path when `d` is an array. */
  staggerInFrames?: number;
  stroke?: string;
  strokeWidth?: number;
  width?: number;
  height?: number;
  /** Omit to frame the artwork automatically from its bounding box. */
  viewBox?: string;
  /** Colour flooded in behind the stroke once a path finishes drawing. */
  fill?: string;
  /** Bright dot riding the tip of the stroke while it draws. */
  head?: boolean;
  glow?: boolean;
};

/** Padding in path units so the stroke is not clipped by an auto viewBox. */
const AUTO_FIT_PADDING = 8;

export const PathDraw: React.FC<PathDrawProps> = ({
  d,
  durationInFrames = 60,
  delayInFrames = 0,
  staggerInFrames = 8,
  stroke = "#e8b86d",
  strokeWidth = 4,
  width = 200,
  height = 200,
  viewBox,
  fill,
  head = true,
  glow = true,
}) => {
  const frame = useCurrentFrame();
  const { id } = useVideoConfig();
  const paths = (Array.isArray(d) ? d : [d]).filter(Boolean);
  // Filter ids are document-global, so two PathDraws mounted on one frame
  // would share a filter. Scoping by composition keeps them independent.
  const filterId = `path-draw-glow-${id}`;
  const resolvedViewBox = viewBox ?? fitViewBox(paths, AUTO_FIT_PADDING);
  // A filter region defaults to a share of the element's bounding box, and a
  // straight horizontal or vertical path has a zero-area box — which would
  // drop the stroke entirely. Anchoring the region to the viewBox keeps every
  // path filtered, degenerate or not.
  const [boxX, boxY, boxWidth, boxHeight] = resolvedViewBox
    .split(/[\s,]+/)
    .map(Number);

  return (
    <svg width={width} height={height} viewBox={resolvedViewBox}>
      {glow ? (
        <defs>
          <filter
            id={filterId}
            filterUnits="userSpaceOnUse"
            x={boxX}
            y={boxY}
            width={boxWidth}
            height={boxHeight}
          >
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      ) : null}

      {paths.map((path, index) => {
        const start = delayInFrames + index * staggerInFrames;
        const progress = clampProgress(
          interpolate(frame, [start, start + durationInFrames], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: EASING.enter,
          }),
        );
        const { strokeDasharray, strokeDashoffset } = getPathDrawStyles(
          progress,
          path,
        );
        // A fill only reads once the outline closes, so it trails the stroke
        // instead of competing with it.
        const fillOpacity = fill
          ? interpolate(
              frame,
              [start + durationInFrames * 0.75, start + durationInFrames * 1.3],
              [0, 1],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: EASING.enter,
              },
            )
          : 0;
        const tip =
          head && progress > 0 && progress < 1
            ? samplePath(path, progress)
            : null;

        return (
          <g key={`${path.slice(0, 16)}-${index}`}>
            {fill ? (
              <path d={path} fill={fill} opacity={fillOpacity} stroke="none" />
            ) : null}
            <path
              d={path}
              fill="none"
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              filter={glow ? `url(#${filterId})` : undefined}
              opacity={0.95}
            />
            {tip ? (
              <circle
                cx={tip.x}
                cy={tip.y}
                r={strokeWidth * 0.9}
                fill={stroke}
                filter={glow ? `url(#${filterId})` : undefined}
              />
            ) : null}
          </g>
        );
      })}
    </svg>
  );
};
