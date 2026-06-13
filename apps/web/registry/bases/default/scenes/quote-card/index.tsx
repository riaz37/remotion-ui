import { AbsoluteFill, useVideoConfig } from "remotion";
import { FadeIn } from "@/remotion/primitives/fade-in";
import { WordHighlight } from "@/remotion/primitives/word-highlight";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";

export type QuoteCardProps = {
  quote: string;
  highlightWord: string;
  author: string;
  backgroundColor?: string;
};

export const QuoteCard: React.FC<QuoteCardProps> = ({
  quote,
  highlightWord,
  author,
  backgroundColor = "#0f172a",
}) => {
  const { width, height } = useVideoConfig();
  const safeArea = getSafeAreaPadding({ width, height });

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        ...safeArea,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <FadeIn durationInFrames={25}>
        <blockquote
          style={{
            maxWidth: "85%",
            textAlign: "center",
            margin: 0,
          }}
        >
          <WordHighlight
            text={quote}
            highlightWord={highlightWord}
            fontSize={scaleFont(64, width)}
            durationInFrames={18}
          />
          <p
            style={{
              color: "#94a3b8",
              fontSize: scaleFont(32, width),
              fontFamily: "system-ui, sans-serif",
              marginTop: 24,
            }}
          >
            - {author}
          </p>
        </blockquote>
      </FadeIn>
    </AbsoluteFill>
  );
};
