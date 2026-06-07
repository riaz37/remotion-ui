import { Img, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { Video } from "@remotion/media";
import { getMediaObjectFitStyle, isVideoSource, type MediaFit } from "@/remotion/lib/media-utils";
import { getSafePadding } from "@/remotion/lib/layout";

export type MediaFrameProps = {
  src: string;
  title?: string;
  caption?: string;
  fit?: MediaFit;
  backgroundColor?: string;
  accentColor?: string;
  radius?: number;
};

export const MediaFrame: React.FC<MediaFrameProps> = ({
  src,
  title,
  caption,
  fit = "cover",
  backgroundColor = "#0f172a",
  accentColor = "#60a5fa",
  radius = 28,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const padding = getSafePadding({ width, height, ratio: 0.08 });
  const enter = interpolate(frame, [0, 24], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const mediaStyle = getMediaObjectFitStyle(fit);

  return (
    <div
      style={{
        width,
        height,
        background: backgroundColor,
        padding,
        display: "flex",
        flexDirection: "column",
        gap: Math.round(padding * 0.28),
        color: "white",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {title ? (
        <div
          style={{
            fontSize: Math.round(width * 0.045),
            fontWeight: 800,
            lineHeight: 1.05,
            opacity: enter,
            transform: `translateY(${(1 - enter) * 18}px)`,
          }}
        >
          {title}
        </div>
      ) : null}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          borderRadius: radius,
          overflow: "hidden",
          border: `3px solid ${accentColor}55`,
          boxShadow: `0 24px 80px ${accentColor}22`,
          opacity: enter,
          transform: `scale(${0.96 + enter * 0.04})`,
          background: "#020617",
        }}
      >
        {isVideoSource(src) ? (
          <Video src={src} muted loop style={mediaStyle} />
        ) : (
          <Img src={src} style={mediaStyle} />
        )}
      </div>
      {caption ? (
        <div
          style={{
            fontSize: Math.round(width * 0.026),
            color: "#cbd5e1",
            opacity: enter,
          }}
        >
          {caption}
        </div>
      ) : null}
    </div>
  );
};
