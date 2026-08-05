import { loadFont } from "@remotion/google-fonts/Inter";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { PathDraw } from "@/remotion/primitives/path-draw";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { DELAY, DURATION, EASING, STAGGER } from "@/remotion/lib/motion-tokens";
import { springSmooth } from "@/remotion/lib/springs";

const { fontFamily } = loadFont("normal", {
  weights: ["500", "600"],
  subsets: ["latin"],
});

export type LogoRevealProps = {
  /** One path, or several drawn in sequence for a multi-stroke mark. */
  pathD: string | string[];
  /** Omit to frame the mark automatically from its bounding box. */
  viewBox?: string;
  /** Mark size in pixels — defaults to a share of the frame's short edge. */
  size?: number;
  wordmark?: string;
  tagline?: string;
  stroke?: string;
  strokeWidth?: number;
  /** Fill flooded into the mark once the stroke closes. */
  fill?: string;
  backgroundColor?: string;
};

const COLORS = {
  bg: "#080810",
  stroke: "#e8b86d",
  glow: "rgba(232,184,109,0.22)",
  ink: "#f4f4f5",
  muted: "rgba(244,244,245,0.6)",
} as const;

/** Beats: bloom → mark draws → wordmark → tagline. */
const BEATS = {
  mark: DELAY.short,
  wordmark: DELAY.short + DURATION.slow,
  tagline: DELAY.short + DURATION.slow + STAGGER.relaxed,
} as const;

export const LogoReveal: React.FC<LogoRevealProps> = ({
  pathD,
  viewBox,
  size,
  wordmark,
  tagline,
  stroke = COLORS.stroke,
  strokeWidth,
  fill,
  backgroundColor = COLORS.bg,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const safeArea = getSafeAreaPadding({ width, height });

  const hasCopy = Boolean(wordmark || tagline);
  // Without a wordmark the mark carries the whole frame, so it grows to fill
  // the space the copy would otherwise take.
  const markSize =
    size ?? Math.round(Math.min(width, height) * (hasCopy ? 0.4 : 0.56));
  const lineWidth = strokeWidth ?? Math.max(2, Math.round(markSize * 0.022));
  const drawFrames = DURATION.slow * 2;

  // The bloom lands first and settles under the mark, so the frame is never
  // empty while the stroke is still short.
  const bloom = spring({
    frame,
    fps,
    config: springSmooth,
    durationInFrames: DURATION.slow,
  });

  const wordmarkLift = spring({
    frame: frame - BEATS.wordmark,
    fps,
    config: springSmooth,
    durationInFrames: DURATION.normal,
  });
  const taglineIn = interpolate(
    frame,
    [BEATS.tagline, BEATS.tagline + DURATION.normal],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASING.enter,
    },
  );

  return (
    <div
      style={{
        width,
        height,
        backgroundColor,
        paddingLeft: safeArea.paddingLeft,
        paddingRight: safeArea.paddingRight,
        paddingTop: safeArea.paddingTop,
        paddingBottom: safeArea.paddingBottom,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: scaleFont(28, width),
        position: "relative",
        fontFamily,
      }}
    >
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          scale: 0.92 + bloom * 0.08,
        }}
      >
        <div
          style={{
            position: "absolute",
            width: markSize * 1.8,
            height: markSize * 1.8,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${COLORS.glow}, transparent 70%)`,
            filter: `blur(${scaleFont(36, width)}px)`,
            opacity: bloom * 0.9,
            scale: 0.8 + bloom * 0.35,
            pointerEvents: "none",
          }}
        />
        <PathDraw
          d={pathD}
          viewBox={viewBox}
          width={markSize}
          height={markSize}
          stroke={stroke}
          strokeWidth={lineWidth}
          fill={fill}
          delayInFrames={BEATS.mark}
          durationInFrames={drawFrames}
          staggerInFrames={STAGGER.normal}
        />
      </div>

      {wordmark ? (
        <div
          style={{
            color: COLORS.ink,
            fontSize: scaleFont(84, width),
            fontWeight: 600,
            lineHeight: 1,
            letterSpacing: -0.5,
            textAlign: "center",
            opacity: wordmarkLift,
            translate: `0 ${(1 - wordmarkLift) * scaleFont(28, width)}px`,
          }}
        >
          {wordmark}
        </div>
      ) : null}

      {tagline ? (
        <div
          style={{
            color: COLORS.muted,
            fontSize: scaleFont(40, width),
            fontWeight: 500,
            lineHeight: 1.2,
            textAlign: "center",
            maxWidth: width * 0.7,
            opacity: taglineIn,
            translate: `0 ${(1 - taglineIn) * scaleFont(16, width)}px`,
          }}
        >
          {tagline}
        </div>
      ) : null}
    </div>
  );
};
