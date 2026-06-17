import { loadFont } from "@remotion/google-fonts/Inter";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { DELAY, DURATION, EASING } from "@/remotion/lib/motion-tokens";

const { fontFamily } = loadFont("normal", {
  weights: ["500", "700"],
  subsets: ["latin"],
});

export type TitleCardProps = {
  title: string;
  subtitle?: string;
  backgroundColor?: string;
  accentColor?: string;
};

const COLORS = {
  bg: "#080810",
  title: "#fafafa",
  subtitle: "#71717a",
  accent: "#e8b86d",
  glow: "rgba(232,184,109,0.22)",
} as const;

export const TitleCard: React.FC<TitleCardProps> = ({
  title,
  subtitle,
  backgroundColor = COLORS.bg,
  accentColor = COLORS.accent,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const safeArea = getSafeAreaPadding({ width, height });
  const barWidth = scaleFont(72, width);

  const barDraw = interpolate(frame, [0, DURATION.fast], [0, 1], {
    easing: EASING.enter,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleEnter = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 110, mass: 0.85 },
    delay: DELAY.short,
  });
  const subtitleEnter = interpolate(
    frame,
    [DELAY.medium, DELAY.medium + DURATION.fast],
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
          inset: 0,
          background: `radial-gradient(ellipse 90% 30% at 50% 0%, ${accentColor}14, transparent 70%)`,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: "52%",
          height: "52%",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.glow} 0%, transparent 72%)`,
          filter: `blur(${scaleFont(48, width)}px)`,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, transparent 60%, ${accentColor}12 100%)`,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: scaleFont(24, width),
          maxWidth: "88%",
          textAlign: "center",
          position: "relative",
        }}
      >
        <div
          style={{
            width: barWidth * barDraw,
            height: scaleFont(4, width),
            borderRadius: 999,
            backgroundColor: accentColor,
            boxShadow: `0 0 ${scaleFont(20, width)}px ${accentColor}66`,
          }}
        />
        <h1
          style={{
            color: COLORS.title,
            fontSize: scaleFont(84, width),
            fontWeight: 700,
            margin: 0,
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            opacity: Math.min(1, titleEnter),
            transform: `translateY(${(1 - titleEnter) * 28}px) scale(${0.94 + titleEnter * 0.06})`,
          }}
        >
          {title}
        </h1>
        {subtitle ? (
          <p
            style={{
              color: COLORS.subtitle,
              fontSize: scaleFont(36, width),
              margin: 0,
              lineHeight: 1.35,
              fontWeight: 500,
              opacity: subtitleEnter,
              transform: `translateY(${(1 - subtitleEnter) * 16}px)`,
            }}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
};
