import { Img, interpolate, useCurrentFrame } from "remotion";

export type ZoomPanFrameProps = {
  src: string;
  fromScale?: number;
  toScale?: number;
  fromX?: number;
  fromY?: number;
  toX?: number;
  toY?: number;
  durationInFrames?: number;
  backgroundColor?: string;
};

export const ZoomPanFrame: React.FC<ZoomPanFrameProps> = ({
  src,
  fromScale = 1,
  toScale = 1.24,
  fromX = 0,
  fromY = 0,
  toX = 0,
  toY = 0,
  durationInFrames = 90,
  backgroundColor = "#020617",
}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = fromScale + (toScale - fromScale) * progress;
  const x = fromX + (toX - fromX) * progress;
  const y = fromY + (toY - fromY) * progress;

  return (
    <div style={{ width: "100%", height: "100%", overflow: "hidden", background: backgroundColor }}>
      <Img
        src={src}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `translate(${x}px, ${y}px) scale(${scale})`,
        }}
      />
    </div>
  );
};
