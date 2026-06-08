import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { getSafePadding } from "@/remotion/lib/layout";

export type HookCardProps = {
  headline: string;
  kicker?: string;
  subtitle?: string;
  accentColor?: string;
  backgroundColor?: string;
};

export const HookCard: React.FC<HookCardProps> = ({
  headline,
  kicker = "Creator insight",
  subtitle,
  accentColor = "#f97316",
  backgroundColor = "#09090b",
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const padding = getSafePadding({ width, height, ratio: 0.085 });
  const enter = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 110, mass: 0.85 },
  });
  const subtitleEnter = interpolate(frame, [14, 32], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const sweep = interpolate(frame, [8, 54], [-18, 112], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <div
      style={{
        width,
        height,
        padding,
        position: "relative",
        overflow: "hidden",
        background:
          backgroundColor,
        color: "white",
        fontFamily: "system-ui, sans-serif",
        display: "flex",
        alignItems: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 18% 18%, ${accentColor}44, transparent 34%), radial-gradient(circle at 88% 78%, ${accentColor}26, transparent 32%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: `${sweep}%`,
          top: "-18%",
          width: width * 0.22,
          height: height * 1.35,
          transform: "rotate(14deg)",
          background: "rgba(255,255,255,0.09)",
          filter: "blur(4px)",
        }}
      />
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          gap: Math.round(width * 0.03),
          maxWidth: width * 0.82,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            opacity: subtitleEnter,
            transform: `translateY(${(1 - subtitleEnter) * 16}px)`,
          }}
        >
          <div
            style={{
              width: Math.round(width * 0.085),
              height: 5,
              borderRadius: 999,
              background: accentColor,
            }}
          />
          <div
            style={{
              color: accentColor,
              fontSize: Math.round(width * 0.028),
              fontWeight: 800,
              letterSpacing: 0,
              textTransform: "uppercase",
            }}
          >
            {kicker}
          </div>
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: Math.round(width * 0.092),
            lineHeight: 0.96,
            letterSpacing: 0,
            fontWeight: 950,
            opacity: Math.min(1, enter),
            transform: `translateY(${(1 - enter) * 42}px) scale(${0.94 + enter * 0.06})`,
            transformOrigin: "left center",
          }}
        >
          {headline}
        </h1>
        {subtitle ? (
          <p
            style={{
              margin: 0,
              maxWidth: width * 0.68,
              color: "#d4d4d8",
              fontSize: Math.round(width * 0.036),
              lineHeight: 1.18,
              opacity: subtitleEnter,
              transform: `translateY(${(1 - subtitleEnter) * 18}px)`,
            }}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
};
