import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { DURATION, EASING } from "@/remotion/lib/motion-tokens";
import { springSmooth } from "@/remotion/lib/springs";

export type DeviceMockupZoomProps = {
  children?: React.ReactNode;
  device?: "phone" | "laptop";
  backgroundColor?: string;
  accentColor?: string;
};

const COLORS = {
  bg: "#080810",
  bezel: "#1a1f2e",
  screen: "#0c1018",
  accent: "#e8b86d",
} as const;

export const DeviceMockupZoom: React.FC<DeviceMockupZoomProps> = ({
  children,
  device = "laptop",
  backgroundColor = COLORS.bg,
  accentColor = COLORS.accent,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const safe = getSafeAreaPadding({ width, height });
  const pullBack = spring({
    fps,
    frame,
    config: springSmooth,
    delay: 12,
    durationInFrames: 48,
  });
  const scale = interpolate(pullBack, [0, 1], [1.35, 0.82]);
  const y = interpolate(pullBack, [0, 1], [8, 0]);
  const glow = interpolate(frame, [0, DURATION.normal], [0, 1], {
    easing: EASING.enter,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const frameW = device === "phone" ? width * 0.34 : width * 0.72;
  const frameH = device === "phone" ? height * 0.62 : height * 0.58;
  const radius = device === "phone" ? 36 : 18;

  return (
    <div
      style={{
        width,
        height,
        background: backgroundColor,
        paddingLeft: safe.paddingLeft,
        paddingRight: safe.paddingRight,
        paddingTop: safe.paddingTop,
        paddingBottom: safe.paddingBottom,
        display: "grid",
        placeItems: "center",
      }}
    >
      <div
        style={{
          position: "relative",
          width: frameW,
          height: frameH,
          transform: `scale(${scale}) translateY(${y}%)`,
          borderRadius: radius,
          background: COLORS.bezel,
          boxShadow: `0 0 ${80 * glow}px ${accentColor}33, inset 0 0 0 1px rgba(255,255,255,0.08)`,
          padding: device === "phone" ? 14 : 18,
          display: "grid",
          placeItems: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: radius - 8,
            background: COLORS.screen,
            overflow: "hidden",
            display: "grid",
            placeItems: "center",
            color: "#e2e8f0",
            fontSize: scaleFont(28, width),
          }}
        >
          {children ?? (
            <span style={{ opacity: 0.7 }}>Your UI preview</span>
          )}
        </div>
      </div>
    </div>
  );
};
