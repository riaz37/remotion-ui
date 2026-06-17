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
  weights: ["400", "600", "700"],
  subsets: ["latin"],
});

export type SplitScreenPanel = {
  src: string;
  label?: string;
  fit?: MediaFit;
};

export type SplitScreenProps = {
  left: SplitScreenPanel;
  right: SplitScreenPanel;
  title?: string;
  backgroundColor?: string;
  accentColor?: string;
};

const COLORS = {
  bg: "#080810",
  panel: "#0a0e14",
  labelBg: "rgba(8,12,20,0.85)",
  text: "#ffffff",
  accent: "#e8b86d",
} as const;

function Panel({
  panel,
  delay,
  labelSize,
  labelInset,
}: {
  panel: SplitScreenPanel;
  delay: number;
  labelSize: number;
  labelInset: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 18, stiffness: 120, mass: 0.9 },
    durationInFrames: DURATION.fast,
  });
  const mediaStyle = getMediaObjectFitStyle(panel.fit ?? "contain");

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        height: "100%",
        overflow: "hidden",
        borderRadius: 20,
        background: COLORS.panel,
        opacity: progress,
        transform: `translateY(${(1 - progress) * 20}px)`,
        position: "relative",
      }}
    >
      {isVideoSource(panel.src) ? (
        <Video src={panel.src} muted loop style={mediaStyle} />
      ) : (
        <Img src={panel.src} style={mediaStyle} />
      )}
      {panel.label ? (
        <div
          style={{
            position: "absolute",
            left: labelInset,
            top: labelInset,
            padding: `${Math.round(labelInset * 0.5)}px ${labelInset}px`,
            borderRadius: 999,
            background: COLORS.labelBg,
            color: COLORS.text,
            fontSize: labelSize,
            fontWeight: 600,
            fontFamily,
            maxWidth: `calc(100% - ${labelInset * 2}px)`,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {panel.label}
        </div>
      ) : null}
    </div>
  );
}

export const SplitScreen: React.FC<SplitScreenProps> = ({
  left,
  right,
  title,
  backgroundColor = COLORS.bg,
  accentColor = COLORS.accent,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const safe = getSafeAreaPadding({ width, height });
  const isPortrait = height > width;
  const labelSize = scaleFont(26, width);
  const labelInset = scaleFont(16, width);
  const titleProgress = title
    ? interpolate(frame, [0, DURATION.fast], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: EASING.enter,
      })
    : 0;

  return (
    <div
      style={{
        width,
        height,
        paddingLeft: safe.paddingLeft,
        paddingRight: safe.paddingRight,
        paddingTop: safe.paddingTop,
        paddingBottom: safe.paddingBottom,
        background: backgroundColor,
        color: "white",
        fontFamily,
        display: "flex",
        flexDirection: "column",
        gap: scaleFont(24, width),
      }}
    >
      {title ? (
        <div
          style={{
            fontSize: scaleFont(64, width),
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            color: accentColor,
            opacity: titleProgress,
            transform: `translateY(${(1 - titleProgress) * 16}px)`,
          }}
        >
          {title}
        </div>
      ) : null}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: isPortrait ? "column" : "row",
          gap: scaleFont(20, width),
        }}
      >
        <Panel
          panel={left}
          delay={STAGGER.normal}
          labelSize={labelSize}
          labelInset={labelInset}
        />
        <Panel
          panel={right}
          delay={STAGGER.normal * 2}
          labelSize={labelSize}
          labelInset={labelInset}
        />
      </div>
    </div>
  );
};
