import { AbsoluteFill } from "remotion";
import { FadeIn } from "@/remotion/primitives/fade-in";
import { PathDraw } from "@/remotion/primitives/path-draw";
import { ScaleIn } from "@/remotion/primitives/scale-in";

export type LogoRevealProps = {
  pathD: string;
  viewBox?: string;
  width?: number;
  height?: number;
  stroke?: string;
  strokeWidth?: number;
  backgroundColor?: string;
};

export const LogoReveal: React.FC<LogoRevealProps> = ({
  pathD,
  viewBox = "0 0 200 200",
  width = 200,
  height = 200,
  stroke = "#60a5fa",
  strokeWidth = 4,
  backgroundColor = "#0f172a",
}) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <ScaleIn durationInFrames={30}>
        <FadeIn durationInFrames={20}>
          <PathDraw
            d={pathD}
            viewBox={viewBox}
            width={width}
            height={height}
            stroke={stroke}
            strokeWidth={strokeWidth}
            durationInFrames={75}
          />
        </FadeIn>
      </ScaleIn>
    </AbsoluteFill>
  );
};
