import { AbsoluteFill, useVideoConfig } from "remotion";
import { FadeIn } from "@/remotion/primitives/fade-in";
import { ScaleIn } from "@/remotion/primitives/scale-in";
import { scaleFont } from "@/remotion/lib/layout";

export type TitleCardProps = {
  title: string;
  subtitle?: string;
  backgroundColor?: string;
  accentColor?: string;
};

export const TitleCard: React.FC<TitleCardProps> = ({
  title,
  subtitle,
  backgroundColor = "#0f172a",
  accentColor = "#3b82f6",
}) => {
  const { width } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: "55%",
          height: "55%",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accentColor}33 0%, transparent 70%)`,
          filter: "blur(40px)",
        }}
      />
      <ScaleIn durationInFrames={28}>
        <FadeIn durationInFrames={22}>
          <div style={{ textAlign: "center", padding: 48, position: "relative" }}>
            <h1
              style={{
                color: "white",
                fontSize: scaleFont(84, width),
                fontWeight: 800,
                fontFamily: "system-ui, sans-serif",
                margin: 0,
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
              }}
            >
              {title}
            </h1>
            {subtitle ? (
              <p
                style={{
                  color: "#94a3b8",
                  fontSize: scaleFont(36, width),
                  fontFamily: "system-ui, sans-serif",
                  marginTop: 20,
                  marginBottom: 0,
                  lineHeight: 1.35,
                }}
              >
                {subtitle}
              </p>
            ) : null}
          </div>
        </FadeIn>
      </ScaleIn>
    </AbsoluteFill>
  );
};
