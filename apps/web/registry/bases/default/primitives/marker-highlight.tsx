import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { scaleFont } from "@/remotion/lib/layout";
import { springSmooth } from "@/remotion/lib/springs";

export type MarkerHighlightProps = {
  text: string;
  highlightWord: string;
  durationInFrames?: number;
  delayInFrames?: number;
  color?: string;
  markerColor?: string;
  invertOnHighlight?: boolean;
  fontSize?: number;
  fontWeight?: number;
  fontFamily?: string;
};

export const MarkerHighlight: React.FC<MarkerHighlightProps> = ({
  text,
  highlightWord,
  durationInFrames = 18,
  delayInFrames = 0,
  color = "#f8fafc",
  markerColor = "#fbbf24",
  invertOnHighlight = false,
  fontSize: fontSizeProp,
  fontWeight = 600,
  fontFamily,
}) => {
  const frame = useCurrentFrame();
  const { width, fps } = useVideoConfig();
  const fontSize = fontSizeProp ?? scaleFont(84, width);
  const index = text.toLowerCase().indexOf(highlightWord.toLowerCase());

  const baseStyle: React.CSSProperties = {
    color,
    fontSize,
    fontWeight,
    lineHeight: 1.3,
    ...(fontFamily !== undefined ? { fontFamily } : {}),
  };

  if (index === -1) {
    return <span style={baseStyle}>{text}</span>;
  }

  const before = text.slice(0, index);
  const word = text.slice(index, index + highlightWord.length);
  const after = text.slice(index + highlightWord.length);

  const highlightProgress = spring({
    fps,
    frame,
    config: springSmooth,
    delay: delayInFrames,
    durationInFrames,
  });
  const scaleX = Math.max(0, Math.min(1, highlightProgress));

  return (
    <span style={baseStyle}>
      {before}
      <span style={{ position: "relative", display: "inline-block" }}>
        <span
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "50%",
            height: "1.05em",
            transform: `translateY(-50%) scaleX(${scaleX})`,
            transformOrigin: "left center",
            backgroundColor: markerColor,
            borderRadius: "0.18em",
            zIndex: 0,
          }}
        />
        <span
          style={{
            position: "relative",
            zIndex: 1,
            color: invertOnHighlight && scaleX > 0.4 ? "#080810" : color,
          }}
        >
          {word}
        </span>
      </span>
      {after}
    </span>
  );
};
