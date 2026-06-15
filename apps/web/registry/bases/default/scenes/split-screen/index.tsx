import { loadFont } from "@remotion/google-fonts/Inter";
import { Img, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Video } from "@remotion/media";
import {
  getMediaObjectFitStyle,
  isVideoSource,
  type MediaFit,
} from "@/remotion/lib/media-utils";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { DURATION, STAGGER } from "@/remotion/lib/motion-tokens";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "700", "800"],
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
  bg: "#0c1018",
  panel: "#0a0e14",
  labelBg: "rgba(8,12,20,0.85)",
  text: "#ffffff",
  accent: "#818cf8",
} as const;

function Panel({
  panel,
  delay,
  labelSize,
}: {
  panel: SplitScreenPanel;
  delay: number;
  labelSize: number;
}) {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [delay, delay + DURATION.fast], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const mediaStyle = getMediaObjectFitStyle(panel.fit);

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
            left: 20,
            top: 20,
            padding: "8px 14px",
            borderRadius: 999,
            background: COLORS.labelBg,
            color: COLORS.text,
            fontSize: labelSize,
            fontWeight: 700,
            fontFamily,
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
  const { width, height } = useVideoConfig();
  const safe = getSafeAreaPadding({ width, height });
  const isPortrait = height > width;
  const labelSize = scaleFont(26, width);

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
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            color: accentColor,
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
        <Panel panel={left} delay={0} labelSize={labelSize} />
        <Panel panel={right} delay={STAGGER.normal} labelSize={labelSize} />
      </div>
    </div>
  );
};
