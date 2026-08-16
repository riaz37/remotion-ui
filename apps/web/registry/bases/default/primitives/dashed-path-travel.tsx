import { useMemo } from "react";
import type { ReactNode } from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { EASING } from "@/remotion/lib/motion-tokens";
import {
  clampProgress,
  fitViewBox,
  samplePath,
  waypointsToPath,
} from "@/remotion/lib/path-utils";

export type TravelPoint = { x: number; y: number };

export type DashedPathTravelProps = {
  /** The route. Give a `d` string, or waypoints and let it build the curve. */
  d?: string;
  waypoints?: TravelPoint[];
  /** Corner rounding when building from waypoints. 0 gives straight hops. */
  smoothing?: number;
  /**
   * What travels the path. Anything renderable; it is centred on the point and,
   * with `orient`, turned to face along the route.
   */
  children?: ReactNode;
  /** Radius of the default dot, used when no children are given. */
  dotRadius?: number;
  /** Turns the traveller to the path's tangent. */
  orient?: boolean;
  width?: number;
  height?: number;
  /** Omit to frame the route automatically from its bounding box. */
  viewBox?: string;
  /** The dashed route behind the traveller. */
  trailColor?: string;
  /** The part of the route not yet travelled. Omit to hide it. */
  trackColor?: string;
  strokeWidth?: number;
  /** Dash and gap length, in path units. */
  dash?: number;
  /** Frames to wait before setting off. */
  delayInFrames?: number;
  /** Frames the trip takes. */
  durationInFrames?: number;
  /** Frame the whole thing starts leaving. Omit to leave it on screen. */
  exitAtInFrames?: number;
  /** Frames the exit takes. */
  exitInFrames?: number;
};

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const DEFAULT_WAYPOINTS: TravelPoint[] = [
  { x: 20, y: 150 },
  { x: 90, y: 60 },
  { x: 190, y: 130 },
  { x: 280, y: 40 },
];

/**
 * Anything travelling any route, laying a dashed trail behind it.
 *
 * The trail is one stroke whose dash pattern is a fixed dash-and-gap with the
 * *undrawn* remainder pushed past the end of the path — not a second path that
 * grows. That keeps the dashes fixed in place as the line extends, so they read
 * as a route being marked out rather than as a dashed line being stretched.
 *
 * The traveller's position and angle come from arc-length sampling, so it moves
 * at a constant speed around corners instead of hurrying through the straight
 * sections the way a per-segment lerp does.
 */
export const DashedPathTravel: React.FC<DashedPathTravelProps> = ({
  d,
  waypoints = DEFAULT_WAYPOINTS,
  smoothing = 0.4,
  children,
  dotRadius = 7,
  orient = false,
  width = 320,
  height = 200,
  viewBox,
  trailColor = "#E8B86D",
  trackColor = "rgba(255,255,255,0.12)",
  strokeWidth = 2.5,
  dash = 9,
  delayInFrames = 0,
  durationInFrames = 70,
  exitAtInFrames,
  exitInFrames = 16,
}) => {
  const frame = useCurrentFrame();
  // Mask ids are document-global, so two travellers on one frame would share
  // one mask and reveal each other's trails.
  const { id } = useVideoConfig();
  const maskId = `dashed-path-travel-${id}`;

  const path = useMemo(
    () => d ?? waypointsToPath(waypoints, smoothing),
    [d, waypoints, smoothing],
  );
  const resolvedViewBox = useMemo(
    () => viewBox ?? fitViewBox(path, 16),
    [viewBox, path],
  );

  const progress = clampProgress(
    interpolate(
      frame,
      [delayInFrames, delayInFrames + durationInFrames],
      [0, 1],
      { easing: EASING.editorial, ...clamp },
    ),
  );

  const exit =
    exitAtInFrames === undefined
      ? 0
      : interpolate(frame, [exitAtInFrames, exitAtInFrames + exitInFrames], [0, 1], {
          easing: EASING.exit,
          ...clamp,
        });

  const head = samplePath(path, progress);

  return (
    <svg
      width={width}
      height={height}
      viewBox={resolvedViewBox}
      style={{ overflow: "visible", opacity: 1 - exit }}
    >
      {trackColor ? (
        <path
          d={path}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      ) : null}

      {/* The trail is a fixed dash pattern revealed by a mask that grows with
          the head. Growing the dash pattern itself would slide every dash along
          the route as the line extends, which reads as a stretching line rather
          than as a route being marked out. */}
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse">
          <path
            d={path}
            fill="none"
            stroke="#fff"
            strokeWidth={strokeWidth * 4}
            strokeLinecap="butt"
            pathLength={1}
            strokeDasharray={`${progress} ${Math.max(0.0001, 1 - progress)}`}
          />
        </mask>
      </defs>

      <path
        d={path}
        fill="none"
        stroke={trailColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${dash}`}
        mask={`url(#${maskId})`}
      />

      <g
        transform={`translate(${head.x} ${head.y}) rotate(${orient ? head.angle : 0})`}
        opacity={progress > 0 ? 1 : 0}
      >
        {children ?? (
          <circle
            r={dotRadius}
            fill={trailColor}
            stroke="rgba(0,0,0,0.35)"
            strokeWidth={1}
          />
        )}
      </g>
    </svg>
  );
};
