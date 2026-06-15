import { loadFont } from "@remotion/google-fonts/Inter";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { DELAY, DURATION, EASING } from "@/remotion/lib/motion-tokens";

const { fontFamily } = loadFont("normal", {
  weights: ["600", "800", "900"],
  subsets: ["latin"],
});

export type HookCardProps = {
  headline: string;
  kicker?: string;
  subtitle?: string;
  accentColor?: string;
  backgroundColor?: string;
};

const COLORS = {
  bg: "#0c0a09",
  text: "#fafaf9",
  muted: "#d6d3d1",
  accent: "#fb923c",
} as const;

export const HookCard: React.FC<HookCardProps> = ({
  headline,
  kicker,
  subtitle,
  accentColor = COLORS.accent,
  backgroundColor = COLORS.bg,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const safeArea = getSafeAreaPadding({ width, height });
  const enter = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 110, mass: 0.85 },
  });
  const subtitleEnter = interpolate(
    frame,
    [DELAY.short, DELAY.short + DURATION.fast],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASING.enter,
    },
  );
  const sweep = interpolate(frame, [DELAY.short, DURATION.slow], [-18, 112], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASING.enter,
  });

  return (
    <div
      style={{
        width,
        height,
        paddingLeft: safeArea.paddingLeft,
        paddingRight: safeArea.paddingRight,
        paddingTop: safeArea.paddingTop,
        paddingBottom: safeArea.paddingBottom,
        position: "relative",
        overflow: "hidden",
        background: backgroundColor,
        color: COLORS.text,
        fontFamily,
        display: "flex",
        alignItems: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 16% 16%, ${accentColor}38, transparent 36%)`,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: `${sweep}%`,
          top: "-18%",
          width: width * 0.2,
          height: height * 1.3,
          transform: "rotate(12deg)",
          background: "rgba(255,255,255,0.06)",
          filter: "blur(4px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          gap: scaleFont(20, width),
          maxWidth: width * 0.84,
        }}
      >
        {kicker ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: scaleFont(14, width),
              opacity: subtitleEnter,
              transform: `translateY(${(1 - subtitleEnter) * 14}px)`,
            }}
          >
            <div
              style={{
                width: scaleFont(48, width),
                height: scaleFont(4, width),
                borderRadius: 999,
                background: accentColor,
              }}
            />
            <div
              style={{
                color: accentColor,
                fontSize: scaleFont(26, width),
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {kicker}
            </div>
          </div>
        ) : null}
        <h1
          style={{
            margin: 0,
            fontSize: scaleFont(88, width),
            lineHeight: 0.98,
            letterSpacing: "-0.03em",
            fontWeight: 900,
            opacity: Math.min(1, enter),
            transform: `translateY(${(1 - enter) * 36}px) scale(${0.94 + enter * 0.06})`,
            transformOrigin: "left center",
          }}
        >
          {headline}
        </h1>
        {subtitle ? (
          <p
            style={{
              margin: 0,
              maxWidth: "72%",
              color: COLORS.muted,
              fontSize: scaleFont(34, width),
              lineHeight: 1.2,
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
