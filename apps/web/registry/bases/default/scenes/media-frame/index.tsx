import { loadFont } from "@remotion/google-fonts/Inter";
import { Img, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Video } from "@remotion/media";
import {
  getMediaObjectFitStyle,
  isVideoSource,
  type MediaFit,
} from "@/remotion/lib/media-utils";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { DURATION } from "@/remotion/lib/motion-tokens";

const { fontFamily } = loadFont("normal", {
  weights: ["600", "700", "800"],
  subsets: ["latin"],
});

export type MediaFrameProps = {
  src: string;
  title?: string;
  caption?: string;
  fit?: MediaFit;
  backgroundColor?: string;
  accentColor?: string;
  radius?: number;
};

const COLORS = {
  bg: "#0a0e16",
  frame: "#050810",
  title: "#f8fafc",
  caption: "#cbd5e1",
  accent: "#38bdf8",
} as const;

export const MediaFrame: React.FC<MediaFrameProps> = ({
  src,
  title,
  caption,
  fit = "cover",
  backgroundColor = COLORS.bg,
  accentColor = COLORS.accent,
  radius,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const safeArea = getSafeAreaPadding({ width, height });
  const cornerRadius = radius ?? scaleFont(20, width);
  const enter = interpolate(frame, [0, DURATION.fast], [0, 1], {
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
        paddingLeft: safeArea.paddingLeft,
        paddingRight: safeArea.paddingRight,
        paddingTop: safeArea.paddingTop,
        paddingBottom: safeArea.paddingBottom,
        display: "flex",
        flexDirection: "column",
        gap: scaleFont(16, width),
        color: COLORS.title,
        fontFamily,
      }}
    >
      {title ? (
        <div
          style={{
            fontSize: scaleFont(44, width),
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            opacity: enter,
            transform: `translateY(${(1 - enter) * 16}px)`,
          }}
        >
          {title}
        </div>
      ) : null}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          borderRadius: cornerRadius,
          overflow: "hidden",
          border: `${scaleFont(2, width)}px solid ${accentColor}44`,
          boxShadow: `0 ${scaleFont(20, width)}px ${scaleFont(64, width)}px ${accentColor}18`,
          opacity: enter,
          transform: `scale(${0.97 + enter * 0.03})`,
          background: COLORS.frame,
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
            fontSize: scaleFont(26, width),
            color: COLORS.caption,
            fontWeight: 500,
            opacity: enter,
          }}
        >
          {caption}
        </div>
      ) : null}
    </div>
  );
};
