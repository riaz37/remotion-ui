import { loadFont } from "@remotion/google-fonts/Inter";
import { Img, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { DURATION } from "@/remotion/lib/motion-tokens";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "700", "800"],
  subsets: ["latin"],
});

export type SpotlightTarget = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CalloutSpotlightProps = {
  title: string;
  subtitle?: string;
  kicker?: string;
  target: SpotlightTarget;
  backgroundSrc?: string;
  backgroundColor?: string;
  accentColor?: string;
};

const COLORS = {
  bg: "#0a0e17",
  overlay: "rgba(8,12,20,0.72)",
  muted: "#a1a1aa",
  accent: "#38bdf8",
} as const;

export const CalloutSpotlight: React.FC<CalloutSpotlightProps> = ({
  title,
  subtitle,
  kicker,
  target,
  backgroundSrc,
  backgroundColor = COLORS.bg,
  accentColor = COLORS.accent,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const safe = getSafeAreaPadding({ width, height });
  const progress = interpolate(frame, [0, DURATION.fast], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const calloutOnLeft = target.x + target.width / 2 > width / 2;

  return (
    <div
      style={{
        width,
        height,
        background: backgroundColor,
        position: "relative",
        overflow: "hidden",
        color: "white",
        fontFamily,
      }}
    >
      {backgroundSrc ? (
        <Img
          src={backgroundSrc}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.8,
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: COLORS.overlay,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: target.x,
          top: target.y,
          width: target.width,
          height: target.height,
          borderRadius: 20,
          border: `4px solid ${accentColor}`,
          boxShadow: `0 0 0 9999px rgba(8,12,20,0.42), 0 0 48px ${accentColor}66`,
          opacity: progress,
          transform: `scale(${0.96 + progress * 0.04})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: calloutOnLeft ? safe.paddingLeft : undefined,
          right: calloutOnLeft ? undefined : safe.paddingRight,
          bottom: safe.paddingBottom,
          maxWidth: width * 0.48,
          opacity: progress,
          transform: `translateY(${(1 - progress) * 24}px)`,
        }}
      >
        {kicker ? (
          <div
            style={{
              color: accentColor,
              fontSize: scaleFont(32, width),
              fontWeight: 800,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: scaleFont(12, width),
            }}
          >
            {kicker}
          </div>
        ) : null}
        <div
          style={{
            fontSize: scaleFont(64, width),
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </div>
        {subtitle ? (
          <div
            style={{
              color: COLORS.muted,
              fontSize: scaleFont(36, width),
              marginTop: scaleFont(14, width),
              lineHeight: 1.3,
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </div>
    </div>
  );
};
