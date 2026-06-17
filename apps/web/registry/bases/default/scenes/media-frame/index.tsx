import { loadFont } from "@remotion/google-fonts/Inter";
import { Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Video } from "@remotion/media";
import {
  getMediaObjectFitStyle,
  isVideoSource,
  type MediaFit,
} from "@/remotion/lib/media-utils";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { DURATION, EASING, STAGGER } from "@/remotion/lib/motion-tokens";

const { fontFamily } = loadFont("normal", {
  weights: ["500", "600", "700"],
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
  bg: "#080810",
  frame: "#050810",
  title: "#f8fafc",
  caption: "#cbd5e1",
  accent: "#e8b86d",
} as const;

export const MediaFrame: React.FC<MediaFrameProps> = ({
  src,
  title,
  caption,
  fit = "contain",
  backgroundColor = COLORS.bg,
  accentColor = COLORS.accent,
  radius,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const safeArea = getSafeAreaPadding({ width, height });
  const cornerRadius = radius ?? scaleFont(20, width);
  const titleEnter = interpolate(frame, [0, DURATION.fast], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASING.enter,
  });
  const mediaEnter = spring({
    frame: frame - STAGGER.normal,
    fps,
    config: { damping: 18, stiffness: 110, mass: 0.9 },
    durationInFrames: DURATION.fast,
  });
  const captionEnter = interpolate(
    frame,
    [STAGGER.normal * 2, STAGGER.normal * 2 + DURATION.fast],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASING.enter,
    },
  );
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
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            opacity: titleEnter,
            transform: `translateY(${(1 - titleEnter) * 16}px)`,
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
          border: `${scaleFont(1, width)}px solid ${accentColor}55`,
          boxShadow: `0 0 0 ${scaleFont(1, width)}px ${accentColor}12, 0 ${scaleFont(20, width)}px ${scaleFont(64, width)}px rgba(0,0,0,0.35)`,
          opacity: mediaEnter,
          transform: `scale(${0.97 + mediaEnter * 0.03})`,
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
            opacity: captionEnter,
            transform: `translateY(${(1 - captionEnter) * 10}px)`,
          }}
        >
          {caption}
        </div>
      ) : null}
    </div>
  );
};
