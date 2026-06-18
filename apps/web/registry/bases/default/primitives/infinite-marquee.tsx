import { measureText } from "@remotion/layout-utils";
import { useCurrentFrame, useVideoConfig } from "remotion";
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

function getItemWidth(
  text: string,
  fontSize: number,
  fontWeight: number,
  fontFamily?: string,
) {
  const family = fontFamily ?? "system-ui";

  if (typeof document !== "undefined") {
    return measureText({
      text,
      fontFamily: family,
      fontSize,
      fontWeight: String(fontWeight),
    }).width;
  }

  return text.length * fontSize * 0.55;
}

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

  const itemWidth = getItemWidth(text, fontSize, fontWeight, fontFamily);
  const repetitions = Math.max(4, Math.ceil(width / itemWidth) + 2);
  const halfWidth =
    repetitions * itemWidth + Math.max(0, repetitions - 1) * gap;
  const loopPeriodFrames = Math.max(1, Math.round(halfWidth / speed));
  const progress = (frame % loopPeriodFrames) / loopPeriodFrames;

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
          whiteSpace: "nowrap",
          translate: `${-progress * 50}% 0`,
          fontSize,
          fontWeight,
          color,
          ...(fontFamily ? { fontFamily } : {}),
        }}
      >
        {Array.from({ length: repetitions * 2 }, (_, i) => (
          <span key={i}>{text}</span>
        ))}
      </div>
    </div>
  );
};
