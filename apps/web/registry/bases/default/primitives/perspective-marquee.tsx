import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { scaleFont } from "@/remotion/lib/layout";

export type PerspectiveMarqueeProps = {
  text: string;
  speed?: number;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  fontFamily?: string;
};

export const PerspectiveMarquee: React.FC<PerspectiveMarqueeProps> = ({
  text,
  speed = 1.5,
  fontSize: fontSizeProp,
  color = "#f4f4f5",
  fontWeight = 600,
  fontFamily,
}) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const fontSize = fontSizeProp ?? scaleFont(52, width);
  const segment = `${text} • `.repeat(6);
  const offset = (frame * speed * 3) % 600;
  const fade = interpolate(
    Math.sin(frame / 20),
    [-1, 1],
    [0.45, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <div
      style={{
        width: "100%",
        overflow: "hidden",
        perspective: 900,
        transformStyle: "preserve-3d",
      }}
    >
      <div
        style={{
          display: "inline-block",
          whiteSpace: "nowrap",
          transform: `rotateX(18deg) rotateY(-8deg) translateX(${-offset}px)`,
          fontSize,
          fontWeight,
          color,
          opacity: fade,
          ...(fontFamily ? { fontFamily } : {}),
        }}
      >
        {segment}
      </div>
    </div>
  );
};
