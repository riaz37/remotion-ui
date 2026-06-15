import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { scaleFont } from "@/remotion/lib/layout";
import { springSmooth } from "@/remotion/lib/springs";

export type WordHighlightProps = {
  text: string;
  highlightWord: string;
  durationInFrames?: number;
  delayInFrames?: number;
  color?: string;
  highlightColor?: string;
  fontSize?: number;
  fontWeight?: number;
  fontFamily?: string;
};

const HighlightWipe: React.FC<{
  word: string;
  color: string;
  delayInFrames: number;
  durationInFrames: number;
}> = ({ word, color, delayInFrames, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const highlightProgress = spring({
    fps,
    frame,
    config: springSmooth,
    delay: delayInFrames,
    durationInFrames,
  });
  const scaleX = Math.max(0, Math.min(1, highlightProgress));

  return (
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
          backgroundColor: color,
          borderRadius: "0.18em",
          zIndex: 0,
        }}
      />
      <span style={{ position: "relative", zIndex: 1 }}>{word}</span>
    </span>
  );
};

export const WordHighlight: React.FC<WordHighlightProps> = ({
  text,
  highlightWord,
  durationInFrames = 18,
  delayInFrames = 0,
  color = "#f8fafc",
  highlightColor = "#fbbf24",
  fontSize: fontSizeProp,
  fontWeight = 600,
  fontFamily,
}) => {
  const { width } = useVideoConfig();
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

  return (
    <span style={baseStyle}>
      {before}
      <HighlightWipe
        word={word}
        color={highlightColor}
        delayInFrames={delayInFrames}
        durationInFrames={durationInFrames}
      />
      {after}
    </span>
  );
};
