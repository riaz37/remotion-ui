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
  durationInFrames = 20,
  delayInFrames = 0,
  color = "#f4f4f5",
  markerColor = "#e8b86d",
  invertOnHighlight = true,
  fontSize: fontSizeProp,
  fontWeight = 600,
  fontFamily,
}) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const fontSize = fontSizeProp ?? scaleFont(72, width);
  const index = text.toLowerCase().indexOf(highlightWord.toLowerCase());
  const progress = spring({
    fps,
    frame,
    config: springSmooth,
    delay: delayInFrames,
    durationInFrames,
  });

  const baseStyle: React.CSSProperties = {
    fontSize,
    fontWeight,
    color,
    lineHeight: 1.3,
    ...(fontFamily ? { fontFamily } : {}),
  };

  if (index === -1) {
    return <span style={baseStyle}>{text}</span>;
  }

  const before = text.slice(0, index);
  const word = text.slice(index, index + highlightWord.length);
  const after = text.slice(index + highlightWord.length);

  return (
    <span style={baseStyle}>
      {before}
      <span style={{ position: "relative", display: "inline-block" }}>
        <span
          style={{
            position: "absolute",
            left: "-0.08em",
            right: "-0.08em",
            top: "50%",
            height: "1.05em",
            transform: `translateY(-50%) scaleX(${progress})`,
            transformOrigin: "left center",
            backgroundColor: markerColor,
            borderRadius: "0.12em",
            zIndex: 0,
          }}
        />
        <span
          style={{
            position: "relative",
            zIndex: 1,
            color: invertOnHighlight && progress > 0.4 ? "#080810" : color,
          }}
        >
          {word}
        </span>
      </span>
      {after}
    </span>
  );
};
