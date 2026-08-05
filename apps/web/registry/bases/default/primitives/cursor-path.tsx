import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { EASING } from "@/remotion/lib/motion-tokens";
import { springSnappy } from "@/remotion/lib/springs";
import {
  clampProgress,
  getPathDrawStyles,
  samplePath,
  waypointProgress,
  waypointsToPath,
  type PathPoint,
} from "@/remotion/lib/path-utils";

export type CursorPoint = PathPoint;

export type CursorPathProps = {
  /** Waypoints in the parent's coordinate space. Ignored when `d` is set. */
  points?: CursorPoint[];
  /** Drive the cursor along an authored SVG path instead of waypoints. */
  d?: string;
  durationInFrames?: number;
  delayInFrames?: number;
  color?: string;
  size?: number;
  /** 0 hops in straight lines; higher values round the corners. */
  smoothing?: number;
  /** `draw` reveals the route behind the cursor, `guide` shows it up front. */
  trail?: "draw" | "guide" | "none";
  /** Waypoint indices that get a click ripple as the cursor arrives. */
  clickAt?: number[];
};

const CLICK_DURATION = 18;

export const CursorPath: React.FC<CursorPathProps> = ({
  points = [],
  d,
  durationInFrames = 90,
  delayInFrames = 0,
  color = "#e8b86d",
  size = 34,
  smoothing = 0.6,
  trail = "draw",
  clickAt = [],
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const path = d ?? waypointsToPath(points, smoothing);

  if (!path) {
    return null;
  }

  // Travel is measured in arc length, not waypoint index, so the cursor holds
  // one speed across a long hop and a short one.
  const progress = clampProgress(
    interpolate(
      frame,
      [delayInFrames, delayInFrames + durationInFrames],
      [0, 1],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: EASING.editorial,
      },
    ),
  );
  const position = samplePath(path, progress);
  const trailStyles = getPathDrawStyles(progress, path);

  // A click fires on arrival, so its frame comes from where the waypoint sits
  // along the path rather than from a hand-timed offset.
  const stops = d ? [] : waypointProgress(path, points);
  const clicks = clickAt
    .filter((index) => stops[index] !== undefined)
    .map((index) => ({
      point: points[index],
      startFrame: delayInFrames + stops[index] * durationInFrames,
    }));

  return (
    <svg style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      {trail === "guide" ? (
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeOpacity={0.28}
          strokeDasharray="6 10"
          strokeLinecap="round"
        />
      ) : null}

      {trail === "draw" ? (
        <>
          <path
            d={path}
            fill="none"
            stroke={color}
            strokeWidth={3}
            strokeOpacity={0.18}
            strokeLinecap="round"
          />
          <path
            d={path}
            fill="none"
            stroke={color}
            strokeWidth={5}
            strokeOpacity={0.8}
            strokeLinecap="round"
            strokeDasharray={trailStyles.strokeDasharray}
            strokeDashoffset={trailStyles.strokeDashoffset}
          />
        </>
      ) : null}

      {clicks.map(({ point, startFrame }, index) => {
        const pulse = spring({
          frame: frame - startFrame,
          fps,
          config: springSnappy,
          durationInFrames: CLICK_DURATION,
        });
        if (pulse <= 0 || pulse >= 1) {
          return null;
        }

        return (
          <circle
            key={`click-${index}`}
            cx={point.x}
            cy={point.y}
            r={6 + pulse * size * 0.9}
            fill="none"
            stroke={color}
            strokeWidth={2}
            opacity={0.7 - pulse * 0.7}
          />
        );
      })}

      <g transform={`translate(${position.x} ${position.y})`}>
        <path
          d={[
            "M0 0",
            `L0 ${size}`,
            `L${size * 0.26} ${size * 0.74}`,
            `L${size * 0.47} ${size}`,
            `L${size * 0.65} ${size * 0.88}`,
            `L${size * 0.44} ${size * 0.56}`,
            `L${size * 0.74} ${size * 0.56}`,
            "Z",
          ].join(" ")}
          fill="#f8fafc"
          stroke="#080810"
          strokeWidth={size * 0.06}
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
};
