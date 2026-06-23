import { loadFont } from "@remotion/google-fonts/Inter";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { MarkerHighlight } from "@/remotion/primitives/marker-highlight";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { DELAY, DURATION, EASING } from "@/remotion/lib/motion-tokens";

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
  bg: "#080810",
  author: "#a1a1aa",
  accent: "#f472b6",
  mark: "rgba(244,114,182,0.28)",
} as const;

export const QuoteCard: React.FC<QuoteCardProps> = ({
  quote,
  highlightWord,
  author,
  backgroundColor = COLORS.bg,
  accentColor = COLORS.accent,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const safeArea = getSafeAreaPadding({ width, height });

  const backingEnter = interpolate(frame, [0, DURATION.fast], [0, 1], {
    easing: EASING.enter,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const quoteEnter = interpolate(
    frame,
    [DELAY.short, DELAY.short + DURATION.normal],
    [0, 1],
    {
      easing: EASING.enter,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const authorEnter = interpolate(
    frame,
    [DELAY.medium + DURATION.fast, DELAY.medium + DURATION.fast + DURATION.fast],
    [0, 1],
    {
      easing: EASING.enter,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  return (
    <div
      style={{
        width,
        height,
        backgroundColor,
        backgroundImage: `radial-gradient(circle at 50% 40%, ${COLORS.mark}, transparent 55%)`,
        paddingLeft: safeArea.paddingLeft,
        paddingRight: safeArea.paddingRight,
        paddingTop: safeArea.paddingTop,
        paddingBottom: safeArea.paddingBottom,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily,
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: "78%",
          maxWidth: scaleFont(920, width),
          height: "58%",
          borderRadius: scaleFont(28, width),
          background: `linear-gradient(145deg, ${accentColor}16 0%, ${accentColor}08 100%)`,
          border: `1px solid ${accentColor}24`,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.1), 0 0 ${scaleFont(40, width)}px ${accentColor}12`,
          opacity: backingEnter,
          transform: `scale(${0.94 + backingEnter * 0.06})`,
          pointerEvents: "none",
        }}
      />
      <blockquote
        style={{
          maxWidth: "86%",
          textAlign: "center",
          margin: 0,
          position: "relative",
          opacity: quoteEnter,
          transform: `translateY(${(1 - quoteEnter) * 20}px)`,
        }}
      >
        <MarkerHighlight
          text={quote}
          highlightWord={highlightWord}
          fontSize={scaleFont(64, width)}
          durationInFrames={DURATION.normal}
          delayInFrames={DELAY.medium}
          markerColor={accentColor}
          fontWeight={600}
          fontFamily={fontFamily}
        />
        {author ? (
          <p
            style={{
              color: COLORS.author,
              fontSize: scaleFont(32, width),
              marginTop: scaleFont(24, width),
              marginBottom: 0,
              fontWeight: 500,
              opacity: authorEnter,
              transform: `translateY(${(1 - authorEnter) * 10}px)`,
            }}
          >
            — {author}
          </p>
        ) : null}
      </blockquote>
    </div>
  );
};
