import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { scaleFont } from "@/remotion/lib/layout";

export type InfiniteMarqueeProps = {
  text: string;
  speed?: number;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  fontFamily?: string;
  gap?: number;
};

export const InfiniteMarquee: React.FC<InfiniteMarqueeProps> = ({
  text,
  speed = 2,
  fontSize: fontSizeProp,
  color = "#f4f4f5",
  fontWeight = 600,
  fontFamily,
  gap = 48,
}) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const fontSize = fontSizeProp ?? scaleFont(56, width);
  const segment = `${text} `.repeat(4);
  const offset = (frame * speed) % (segment.length * fontSize * 0.55 + gap);

  return (
    <div
      style={{
        width: "100%",
        overflow: "hidden",
        whiteSpace: "nowrap",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          gap,
          transform: `translateX(${-offset}px)`,
          fontSize,
          fontWeight,
          color,
          ...(fontFamily ? { fontFamily } : {}),
        }}
      >
        <span>{segment}</span>
        <span>{segment}</span>
      </div>
    </div>
  );
};
