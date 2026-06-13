import { AbsoluteFill, Img, useVideoConfig } from "remotion";
import { FadeIn } from "@/remotion/primitives/fade-in";
import { ScaleIn } from "@/remotion/primitives/scale-in";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";

export type EndCardProps = {
  title: string;
  cta?: string;
  url?: string;
  logoSrc?: string;
  logoSize?: number;
  backgroundColor?: string;
  accentColor?: string;
};

export const EndCard: React.FC<EndCardProps> = ({
  title,
  cta = "Learn more",
  url,
  logoSrc,
  logoSize,
  backgroundColor = "#0f172a",
  accentColor = "#60a5fa",
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
      <ScaleIn durationInFrames={28}>
        <FadeIn durationInFrames={22}>
          <div
            style={{
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 20,
            }}
          >
            <h1
              style={{
                color: "white",
                fontSize: scaleFont(84, width),
                fontFamily: "system-ui, sans-serif",
                fontWeight: 700,
                margin: 0,
                lineHeight: 1.1,
              }}
            >
              {logoSrc ? (
                <Img
                  src={logoSrc}
                  style={{
                    width: logoSize ?? scaleFont(112, width),
                    height: logoSize ?? scaleFont(112, width),
                    borderRadius: scaleFont(24, width),
                    display: "block",
                    margin: "0 auto",
                  }}
                />
              ) : (
                title
              )}
            </h1>
            {!logoSrc ? null : (
              <p
                style={{
                  color: "white",
                  fontSize: scaleFont(52, width),
                  fontFamily: "system-ui, sans-serif",
                  fontWeight: 700,
                  margin: 0,
                  lineHeight: 1.1,
                }}
              >
                {title}
              </p>
            )}
            <div
              style={{
                backgroundColor: accentColor,
                color: "white",
                fontSize: scaleFont(36, width),
                fontFamily: "system-ui, sans-serif",
                fontWeight: 600,
                padding: "14px 32px",
                borderRadius: 999,
                boxShadow: `0 8px 24px ${accentColor}55`,
              }}
            >
              {cta}
            </div>
            {url ? (
              <p
                style={{
                  color: "#64748b",
                  fontSize: scaleFont(32, width),
                  fontFamily: "system-ui, sans-serif",
                  margin: 0,
                }}
              >
                {url}
              </p>
            ) : null}
          </div>
        </FadeIn>
      </ScaleIn>
    </AbsoluteFill>
  );
};
