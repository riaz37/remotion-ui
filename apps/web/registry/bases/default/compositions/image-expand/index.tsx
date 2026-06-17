import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { EASING_ENTER } from "@/remotion/lib/timing";

export type ImageExpandProps = {
  accentColor?: string;
};

export const ImageExpand: React.FC<ImageExpandProps> = ({
  accentColor = "#e8b86d",
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const expand = interpolate(frame, [20, 70], [0, 1], {
    easing: EASING_ENTER,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const w = interpolate(expand, [0, 1], [width * 0.32, width]);
  const h = interpolate(expand, [0, 1], [height * 0.28, height]);
  const radius = interpolate(expand, [0, 1], [24, 0]);

  return (
    <AbsoluteFill style={{ background: "#080810", display: "grid", placeItems: "center" }}>
      <div
        style={{
          width: w,
          height: h,
          borderRadius: radius,
          background: `linear-gradient(135deg, ${accentColor}44, rgba(45,212,191,0.2))`,
          border: `1px solid ${accentColor}55`,
          boxShadow: `0 0 ${60 * expand}px ${accentColor}33`,
        }}
      />
    </AbsoluteFill>
  );
};
