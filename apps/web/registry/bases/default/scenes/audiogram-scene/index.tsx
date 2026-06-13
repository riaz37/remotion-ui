import { AbsoluteFill, Img, useVideoConfig } from "remotion";
import { AudiogramBars } from "@/remotion/primitives/audiogram-bars";
import { FadeIn } from "@/remotion/primitives/fade-in";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";

export type AudiogramSceneProps = {
  src: string;
  title?: string;
  subtitle?: string;
  logoSrc?: string;
  logoSize?: number;
  accentColor?: string;
  backgroundColor?: string;
};

export const AudiogramScene: React.FC<AudiogramSceneProps> = ({
  src,
  title = "Podcast Episode",
  subtitle,
  logoSrc,
  logoSize,
  accentColor = "#60a5fa",
  backgroundColor = "#0f172a",
}) => {
  const { width, height } = useVideoConfig();
  const safeArea = getSafeAreaPadding({ width, height });

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        backgroundImage:
          "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(59, 130, 246, 0.12), transparent)",
        ...safeArea,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 32,
      }}
    >
      <FadeIn durationInFrames={20}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: logoSrc ? "center" : "flex-start",
            textAlign: logoSrc ? "center" : "left",
            gap: logoSrc ? 20 : 0,
          }}
        >
          {logoSrc ? (
            <Img
              src={logoSrc}
              style={{
                width: logoSize ?? scaleFont(80, width),
                height: logoSize ?? scaleFont(80, width),
                borderRadius: scaleFont(18, width),
              }}
            />
          ) : null}
          <h1
            style={{
              color: "white",
              fontSize: scaleFont(48, width),
              fontWeight: 700,
              margin: 0,
              fontFamily: "system-ui, sans-serif",
            }}
          >
            {title}
          </h1>
          {subtitle ? (
            <p
              style={{
                color: "#94a3b8",
                fontSize: scaleFont(28, width),
                margin: "8px 0 0",
                fontFamily: "system-ui, sans-serif",
              }}
            >
              {subtitle}
            </p>
          ) : null}
        </div>
      </FadeIn>
      <FadeIn durationInFrames={24} delayInFrames={8}>
        <AudiogramBars
          src={src}
          barColor={accentColor}
          height={Math.round(height * 0.18)}
        />
      </FadeIn>
    </AbsoluteFill>
  );
};
