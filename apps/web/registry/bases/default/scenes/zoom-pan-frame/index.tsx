import { Img, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import {
  getMediaObjectFitStyle,
  type MediaFit,
} from "@/remotion/lib/media-utils";
import { getSafeAreaPadding } from "@/remotion/lib/layout";
import { EASING } from "@/remotion/lib/motion-tokens";

export type ZoomPanFrameProps = {
  src: string;
  fit?: MediaFit;
  fromScale?: number;
  toScale?: number;
  fromX?: number;
  fromY?: number;
  toX?: number;
  toY?: number;
  durationInFrames?: number;
  backgroundColor?: string;
};

const COLORS = {
  bg: "#080a10",
  vignette: "rgba(0,0,0,0.28)",
} as const;

export const ZoomPanFrame: React.FC<ZoomPanFrameProps> = ({
  src,
  fit = "contain",
  fromScale = 1,
  toScale = 1.22,
  fromX = 0,
  fromY = 0,
  toX = 0,
  toY = 0,
  durationInFrames = 90,
  backgroundColor = COLORS.bg,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const safeArea = getSafeAreaPadding({ width, height });
  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASING.editorial,
  });
  const scale = fromScale + (toScale - fromScale) * progress;
  const x = fromX + (toX - fromX) * progress;
  const y = fromY + (toY - fromY) * progress;
  const mediaStyle = getMediaObjectFitStyle(fit);

  return (
    <div
      style={{
        width,
        height,
        overflow: "hidden",
        background: backgroundColor,
        position: "relative",
      }}
    >
      <Img
        src={src}
        style={{
          ...mediaStyle,
          transform: `translate(${x}px, ${y}px) scale(${scale})`,
          transformOrigin: "center center",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          boxShadow: `inset 0 0 ${Math.max(safeArea.paddingLeft, safeArea.paddingTop)}px ${COLORS.vignette}`,
          pointerEvents: "none",
        }}
      />
    </div>
  );
};
