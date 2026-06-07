import { interpolate, useCurrentFrame } from "remotion";
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
  stroke = "#ffffff",
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
    }),
  );
  const { strokeDasharray, strokeDashoffset } = getPathDrawStyles(progress, d);

  return (
    <svg width={width} height={height} viewBox={viewBox}>
      <path
        d={d}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={strokeDasharray}
        strokeDashoffset={strokeDashoffset}
      />
    </svg>
  );
};
