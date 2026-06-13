import { Img, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Video } from "@remotion/media";
import {
  getMediaObjectFitStyle,
  isVideoSource,
  type MediaFit,
} from "@/remotion/lib/media-utils";
import { getSafePadding } from "@/remotion/lib/layout";

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

function Panel({ panel, delay }: { panel: SplitScreenPanel; delay: number }) {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [delay, delay + 24], [0, 1], {
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
        borderRadius: 24,
        background: "#020617",
        opacity: progress,
        transform: `translateY(${(1 - progress) * 24}px)`,
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
            left: 24,
            top: 24,
            padding: "10px 16px",
            borderRadius: 999,
            background: "rgba(15,23,42,0.82)",
            color: "white",
            fontSize: 28,
            fontWeight: 700,
            fontFamily: "system-ui, sans-serif",
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
  backgroundColor = "#0f172a",
  accentColor = "#60a5fa",
}) => {
  const { width, height } = useVideoConfig();
  const padding = getSafePadding({ width, height, ratio: 0.07 });

  return (
    <div
      style={{
        width,
        height,
        padding,
        background: backgroundColor,
        color: "white",
        fontFamily: "system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        gap: Math.round(padding * 0.35),
      }}
    >
      {title ? (
        <div
          style={{
            fontSize: Math.round(width * 0.044),
            fontWeight: 800,
            lineHeight: 1,
          }}
        >
          <span style={{ color: accentColor }}>Compare</span> {title}
        </div>
      ) : null}
      <div style={{ flex: 1, minHeight: 0, display: "flex", gap: 28 }}>
        <Panel panel={left} delay={0} />
        <Panel panel={right} delay={10} />
      </div>
    </div>
  );
};
