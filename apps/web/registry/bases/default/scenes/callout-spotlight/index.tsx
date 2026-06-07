import { Img, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { getSafePadding } from "@/remotion/lib/layout";

export type SpotlightTarget = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CalloutSpotlightProps = {
  title: string;
  subtitle?: string;
  target: SpotlightTarget;
  backgroundSrc?: string;
  backgroundColor?: string;
  accentColor?: string;
};

export const CalloutSpotlight: React.FC<CalloutSpotlightProps> = ({
  title,
  subtitle,
  target,
  backgroundSrc,
  backgroundColor = "#0f172a",
  accentColor = "#60a5fa",
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const padding = getSafePadding({ width, height, ratio: 0.07 });
  const progress = interpolate(frame, [0, 24], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ width, height, background: backgroundColor, position: "relative", overflow: "hidden", color: "white", fontFamily: "system-ui, sans-serif" }}>
      {backgroundSrc ? <Img src={backgroundSrc} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.75 }} /> : null}
      <div style={{ position: "absolute", inset: 0, background: "rgba(2,6,23,0.62)" }} />
      <div style={{ position: "absolute", left: target.x, top: target.y, width: target.width, height: target.height, borderRadius: 24, border: `5px solid ${accentColor}`, boxShadow: `0 0 0 9999px rgba(2,6,23,0.38), 0 0 42px ${accentColor}99`, opacity: progress, transform: `scale(${0.96 + progress * 0.04})` }} />
      <div style={{ position: "absolute", left: padding, right: padding, bottom: padding, maxWidth: width * 0.62, opacity: progress, transform: `translateY(${(1 - progress) * 24}px)` }}>
        <div style={{ color: accentColor, fontSize: 28, fontWeight: 800 }}>Callout</div>
        <div style={{ fontSize: Math.round(width * 0.046), fontWeight: 900, lineHeight: 1.05 }}>{title}</div>
        {subtitle ? <div style={{ color: "#cbd5e1", fontSize: 28, marginTop: 12, lineHeight: 1.3 }}>{subtitle}</div> : null}
      </div>
    </div>
  );
};
