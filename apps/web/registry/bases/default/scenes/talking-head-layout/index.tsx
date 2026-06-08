import { Img, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Video } from "@remotion/media";
import { getSafePadding } from "@/remotion/lib/layout";
import {
  getMediaObjectFitStyle,
  isVideoSource,
  type MediaFit,
} from "@/remotion/lib/media-utils";
import { WaveformLine } from "@/remotion/primitives/waveform-line";

export type TalkingHeadLayoutProps = {
  mediaSrc?: string;
  audioSrc?: string;
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  fit?: MediaFit;
  accentColor?: string;
  backgroundColor?: string;
  showAccentRail?: boolean;
};

export const TalkingHeadLayout: React.FC<TalkingHeadLayoutProps> = ({
  mediaSrc,
  audioSrc,
  title = "Turn one idea into a clip",
  subtitle = "Frame the speaker, reserve caption space, and keep the visual system consistent.",
  eyebrow = "Creator clip",
  fit = "cover",
  accentColor = "#22c55e",
  backgroundColor = "#052e2b",
  showAccentRail = true,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const padding = getSafePadding({ width, height, ratio: 0.075 });
  const isPortrait = height > width;
  const enter = interpolate(frame, [0, 24], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const textEnter = interpolate(frame, [10, 34], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const mediaStyle = getMediaObjectFitStyle(fit);

  return (
    <div
      style={{
        width,
        height,
        position: "relative",
        overflow: "hidden",
        background: backgroundColor,
        color: "white",
        padding,
        fontFamily: "system-ui, sans-serif",
        display: "grid",
        gridTemplateColumns: isPortrait ? "1fr" : "1fr 0.86fr",
        gridTemplateRows: isPortrait ? "1fr auto" : "1fr",
        gap: Math.round(width * (isPortrait ? 0.045 : 0.04)),
        alignItems: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 20% 12%, ${accentColor}33, transparent 34%), linear-gradient(135deg, rgba(255,255,255,0.08), transparent 44%)`,
        }}
      />
      {showAccentRail ? (
        <div
          style={{
            position: "absolute",
            left: padding,
            top: padding,
            bottom: padding,
            width: 6,
            borderRadius: 999,
            background: `linear-gradient(to bottom, ${accentColor}, transparent)`,
            opacity: 0.85,
          }}
        />
      ) : null}
      <div
        style={{
          position: "relative",
          height: isPortrait ? height * 0.55 : height - padding * 2,
          minHeight: 0,
          borderRadius: Math.round(width * 0.035),
          overflow: "hidden",
          border: "3px solid rgba(255,255,255,0.14)",
          boxShadow: `0 32px 90px ${accentColor}22`,
          background: "#020617",
          opacity: enter,
          transform: `translateY(${(1 - enter) * 34}px) scale(${0.97 + enter * 0.03})`,
        }}
      >
        {mediaSrc ? (
          isVideoSource(mediaSrc) ? (
            <Video src={mediaSrc} muted loop style={mediaStyle} />
          ) : (
            <Img src={mediaSrc} style={mediaStyle} />
          )
        ) : (
          <SpeakerPlaceholder accentColor={accentColor} />
        )}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(0,0,0,0.38), transparent 42%)",
          }}
        />
      </div>
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: Math.round(width * 0.024),
          paddingBottom: isPortrait ? Math.round(height * 0.08) : 0,
          opacity: textEnter,
          transform: `translateY(${(1 - textEnter) * 28}px)`,
        }}
      >
        <div
          style={{
            color: accentColor,
            fontSize: Math.round(width * (isPortrait ? 0.038 : 0.024)),
            fontWeight: 850,
            textTransform: "uppercase",
            letterSpacing: 0,
          }}
        >
          {eyebrow}
        </div>
        <h2
          style={{
            margin: 0,
            fontSize: Math.round(width * (isPortrait ? 0.058 : 0.054)),
            lineHeight: 0.98,
            letterSpacing: 0,
            fontWeight: 950,
          }}
        >
          {title}
        </h2>
        <p
          style={{
            margin: 0,
            color: "#d1d5db",
            fontSize: Math.round(width * (isPortrait ? 0.03 : 0.028)),
            lineHeight: 1.22,
          }}
        >
          {subtitle}
        </p>
        {audioSrc ? (
          <div style={{ marginTop: 8 }}>
            <WaveformLine
              src={audioSrc}
              height={Math.round(height * 0.07)}
              strokeColor={accentColor}
              mirror
            />
          </div>
        ) : null}
      </div>
    </div>
  );
};

function SpeakerPlaceholder({ accentColor }: { accentColor: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `radial-gradient(circle at 50% 30%, ${accentColor}55, transparent 36%), #0f172a`,
      }}
    >
      <div
        style={{
          width: "38%",
          aspectRatio: "1",
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${accentColor}, #f8fafc)`,
          boxShadow: `0 24px 80px ${accentColor}44`,
        }}
      />
    </div>
  );
}
