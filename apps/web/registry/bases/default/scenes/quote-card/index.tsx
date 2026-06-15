import { loadFont } from "@remotion/google-fonts/Inter";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { FadeIn } from "@/remotion/primitives/fade-in";
import { WordHighlight } from "@/remotion/primitives/word-highlight";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { DURATION } from "@/remotion/lib/motion-tokens";

const { fontFamily } = loadFont("normal", {
  weights: ["500", "600", "700"],
  subsets: ["latin"],
});

export type QuoteCardProps = {
  quote: string;
  highlightWord: string;
  author?: string;
  backgroundColor?: string;
  accentColor?: string;
};

const COLORS = {
  bg: "#0d0b14",
  author: "#a1a1aa",
  accent: "#e879f9",
  mark: "rgba(232,121,249,0.35)",
} as const;

export const QuoteCard: React.FC<QuoteCardProps> = ({
  quote,
  highlightWord,
  author,
  backgroundColor = COLORS.bg,
  accentColor = COLORS.accent,
}) => {
  const { width, height } = useVideoConfig();
  const safeArea = getSafeAreaPadding({ width, height });

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        backgroundImage: `radial-gradient(circle at 50% 40%, ${COLORS.mark}, transparent 55%)`,
        ...safeArea,
        justifyContent: "center",
        alignItems: "center",
        fontFamily,
      }}
    >
      <FadeIn durationInFrames={DURATION.normal}>
        <blockquote
          style={{
            maxWidth: "86%",
            textAlign: "center",
            margin: 0,
          }}
        >
          <WordHighlight
            text={quote}
            highlightWord={highlightWord}
            fontSize={scaleFont(64, width)}
            durationInFrames={DURATION.fast}
            highlightColor={accentColor}
          />
          {author ? (
            <p
              style={{
                color: COLORS.author,
                fontSize: scaleFont(32, width),
                marginTop: scaleFont(24, width),
                marginBottom: 0,
                fontWeight: 500,
              }}
            >
              — {author}
            </p>
          ) : null}
        </blockquote>
      </FadeIn>
    </AbsoluteFill>
  );
};
