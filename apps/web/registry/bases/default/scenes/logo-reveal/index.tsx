import { AbsoluteFill, useVideoConfig } from "remotion";
import { FadeIn } from "@/remotion/primitives/fade-in";
import { PathDraw } from "@/remotion/primitives/path-draw";
import { ScaleIn } from "@/remotion/primitives/scale-in";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { DURATION } from "@/remotion/lib/motion-tokens";

export type LogoRevealProps = {
  pathD: string;
  viewBox?: string;
  width?: number;
  height?: number;
  stroke?: string;
  strokeWidth?: number;
  backgroundColor?: string;
};

const COLORS = {
  bg: "#0b0f1a",
  stroke: "#818cf8",
  glow: "rgba(129,140,248,0.2)",
} as const;

export const LogoReveal: React.FC<LogoRevealProps> = ({
  pathD,
  viewBox = "0 0 200 200",
  width: logoWidth,
  height: logoHeight,
  stroke = COLORS.stroke,
  strokeWidth,
  backgroundColor = COLORS.bg,
}) => {
  const { width, height } = useVideoConfig();
  const safeArea = getSafeAreaPadding({ width, height });
  const drawWidth = logoWidth ?? scaleFont(200, width);
  const drawHeight = logoHeight ?? scaleFont(200, width);
  const lineWidth = strokeWidth ?? scaleFont(4, width);

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        paddingLeft: safeArea.paddingLeft,
        paddingRight: safeArea.paddingRight,
        paddingTop: safeArea.paddingTop,
        paddingBottom: safeArea.paddingBottom,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: drawWidth * 1.4,
          height: drawWidth * 1.4,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.glow}, transparent 70%)`,
          filter: `blur(${scaleFont(32, width)}px)`,
          pointerEvents: "none",
        }}
      />
      <ScaleIn durationInFrames={DURATION.normal}>
        <FadeIn durationInFrames={DURATION.fast}>
          <PathDraw
            d={pathD}
            viewBox={viewBox}
            width={drawWidth}
            height={drawHeight}
            stroke={stroke}
            strokeWidth={lineWidth}
            durationInFrames={DURATION.slow * 2}
          />
        </FadeIn>
      </ScaleIn>
    </AbsoluteFill>
  );
};
