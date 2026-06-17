import { loadFont } from "@remotion/google-fonts/Inter";
import { Img, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Video } from "@remotion/media";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { DELAY, DURATION, EASING } from "@/remotion/lib/motion-tokens";
import {
  getMediaObjectFitStyle,
  isVideoSource,
  type MediaFit,
} from "@/remotion/lib/media-utils";
import { WaveformLine } from "@/remotion/primitives/waveform-line";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "600", "700"],
  subsets: ["latin"],
});

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

const COLORS = {
  bg: "#061210",
  frame: "#0a1210",
  grid: "rgba(255,255,255,0.06)",
  text: "#f8fafc",
  muted: "#a1a1aa",
  accent: "#2dd4bf",
} as const;

const CAPTION_ZONE_RATIO = 0.22;

function EmptyMediaFrame({
  accentColor,
  width,
}: {
  accentColor: string;
  width: number;
}) {
  const cell = scaleFont(28, width);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: COLORS.frame,
        backgroundImage: `
          linear-gradient(${COLORS.grid} 1px, transparent 1px),
          linear-gradient(90deg, ${COLORS.grid} 1px, transparent 1px)
        `,
        backgroundSize: `${cell}px ${cell}px`,
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: scaleFont(24, width),
          border: `1px dashed ${accentColor}44`,
          borderRadius: scaleFont(12, width),
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: scaleFont(120, width),
          height: scaleFont(120, width),
          marginLeft: -scaleFont(60, width),
          marginTop: -scaleFont(60, width),
          borderRadius: "50%",
          border: `2px solid ${accentColor}33`,
          boxShadow: `inset 0 0 ${scaleFont(40, width)}px ${accentColor}18`,
        }}
      />
    </div>
  );
}

export const TalkingHeadLayout: React.FC<TalkingHeadLayoutProps> = ({
  mediaSrc,
  audioSrc,
  title,
  subtitle,
  eyebrow,
  fit = "contain",
  accentColor = COLORS.accent,
  backgroundColor = COLORS.bg,
  showAccentRail = true,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const safeArea = getSafeAreaPadding({ width, height });
  const isPortrait = height > width;
  const hasText = Boolean(eyebrow || title || subtitle);
  const hasAudio = Boolean(audioSrc);
  const showRail = showAccentRail && !isPortrait;
  const railGap = showRail ? scaleFont(20, width) : 0;
  const contentWidth = width - safeArea.paddingLeft - safeArea.paddingRight;

  const enter = interpolate(frame, [0, DURATION.fast], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASING.enter,
  });
  const textEnter = interpolate(
    frame,
    [DELAY.short, DELAY.short + DURATION.fast],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASING.enter,
    },
  );

  const mediaStyle = getMediaObjectFitStyle(fit);
  const captionReserve = height * CAPTION_ZONE_RATIO;
  const contentHeight =
    height - safeArea.paddingTop - safeArea.paddingBottom - captionReserve;
  const portraitMediaHeight = isPortrait
    ? Math.min(contentHeight * 0.52, height * 0.42)
    : contentHeight;

  const mediaFrame = (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: isPortrait ? portraitMediaHeight : "100%",
        minHeight: 0,
        borderRadius: scaleFont(20, width),
        overflow: "hidden",
        border: `2px solid ${accentColor}33`,
        boxShadow: `0 ${scaleFont(24, width)}px ${scaleFont(64, width)}px ${accentColor}18`,
        opacity: enter,
        transform: `translateY(${(1 - enter) * 28}px) scale(${0.97 + enter * 0.03})`,
        transformOrigin: "center center",
      }}
    >
      {mediaSrc ? (
        isVideoSource(mediaSrc) ? (
          <Video src={mediaSrc} muted loop style={mediaStyle} />
        ) : (
          <Img src={mediaSrc} style={mediaStyle} />
        )
      ) : (
        <EmptyMediaFrame accentColor={accentColor} width={width} />
      )}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to top, rgba(0,0,0,0.32), transparent 42%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );

  const textBlock = hasText ? (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: scaleFont(14, width),
        width: "100%",
        maxWidth: contentWidth,
        minWidth: 0,
        boxSizing: "border-box",
        paddingLeft: railGap,
        opacity: textEnter,
        transform: `translateY(${(1 - textEnter) * 24}px)`,
      }}
    >
      {eyebrow ? (
        <div
          style={{
            color: accentColor,
            fontSize: scaleFont(26, width),
            fontWeight: 600,
          }}
        >
          {eyebrow}
        </div>
      ) : null}
      {title ? (
        <h2
          style={{
            margin: 0,
            fontSize: scaleFont(isPortrait ? 44 : 52, width),
            lineHeight: 1.08,
            letterSpacing: "-0.02em",
            fontWeight: 700,
            wordBreak: "break-word",
          }}
        >
          {title}
        </h2>
      ) : null}
      {subtitle ? (
        <p
          style={{
            margin: 0,
            color: COLORS.muted,
            fontSize: scaleFont(30, width),
            lineHeight: 1.35,
            wordBreak: "break-word",
          }}
        >
          {subtitle}
        </p>
      ) : null}
      {hasAudio ? (
        <div style={{ marginTop: scaleFont(4, width), width: "100%" }}>
          <WaveformLine
            src={audioSrc!}
            height={Math.round(scaleFont(48, width))}
            strokeColor={accentColor}
            mirror
          />
        </div>
      ) : null}
    </div>
  ) : null;

  return (
    <div
      style={{
        width,
        height,
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
        background: backgroundColor,
        color: COLORS.text,
        paddingLeft: safeArea.paddingLeft,
        paddingRight: safeArea.paddingRight,
        paddingTop: safeArea.paddingTop,
        paddingBottom: safeArea.paddingBottom + captionReserve,
        fontFamily,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 18% 10%, ${accentColor}28, transparent 38%)`,
          pointerEvents: "none",
        }}
      />
      {showRail ? (
        <div
          style={{
            position: "absolute",
            left: safeArea.paddingLeft,
            top: safeArea.paddingTop,
            bottom: safeArea.paddingBottom + captionReserve,
            width: scaleFont(5, width),
            borderRadius: 999,
            background: `linear-gradient(to bottom, ${accentColor}, transparent)`,
            opacity: 0.75,
          }}
        />
      ) : null}

      {isPortrait ? (
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            gap: scaleFont(24, width),
            width: "100%",
            height: "100%",
            minHeight: 0,
          }}
        >
          {mediaFrame}
          {textBlock}
        </div>
      ) : (
        <div
          style={{
            position: "relative",
            display: "grid",
            gridTemplateColumns: hasText ? "1fr 0.86fr" : "1fr",
            gridTemplateRows: "1fr",
            gap: scaleFont(20, width),
            alignItems: "center",
            width: "100%",
            height: "100%",
            minHeight: 0,
          }}
        >
          {mediaFrame}
          {textBlock}
        </div>
      )}
    </div>
  );
};
