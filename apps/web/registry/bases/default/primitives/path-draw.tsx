import { interpolate, useCurrentFrame } from "remotion";
import { EASING } from "@/remotion/lib/motion-tokens";
import { clampProgress, getPathDrawStyles } from "@/remotion/lib/path-utils";

export type PathDrawProps = {
  d: string;
  durationInFrames?: number;
  delayInFrames?: number;
  stroke?: string;
  strokeWidth?: number;
  width?: number;
  height?: number;
  viewBox?: string;
  fill?: string;
};

export const PathDraw: React.FC<PathDrawProps> = ({
  d,
  durationInFrames = 60,
  delayInFrames = 0,
  stroke = "#e8b86d",
  strokeWidth = 4,
  width = 200,
  height = 200,
  viewBox = "0 0 200 200",
  fill = "none",
}) => {
  const frame = useCurrentFrame();
  const progress = clampProgress(
    interpolate(frame, [delayInFrames, delayInFrames + durationInFrames], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASING.enter,
    }),
  );
  const { strokeDasharray, strokeDashoffset } = getPathDrawStyles(progress, d);

  return (
    <svg width={width} height={height} viewBox={viewBox}>
      <defs>
        <filter id="path-draw-glow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d={d}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={strokeDasharray}
        strokeDashoffset={strokeDashoffset}
        filter="url(#path-draw-glow)"
        opacity={0.95}
      />
    </svg>
  );
};
