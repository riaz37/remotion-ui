import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { DURATION, EASING } from "@/remotion/lib/motion-tokens";
import { springSmooth } from "@/remotion/lib/springs";
import { SimulatedCursor } from "@/remotion/primitives/simulated-cursor";

export type DragDropFlowProps = {
  label?: string;
  fileName?: string;
  backgroundColor?: string;
  accentColor?: string;
};

const COLORS = {
  bg: "#080810",
  panel: "rgba(12,16,24,0.94)",
  border: "rgba(148,163,184,0.16)",
  accent: "#e8b86d",
} as const;

export const DragDropFlow: React.FC<DragDropFlowProps> = ({
  label = "Drop your clip",
  fileName = "hero-take.mp4",
  backgroundColor = COLORS.bg,
  accentColor = COLORS.accent,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const safe = getSafeAreaPadding({ width, height });
  const drag = spring({
    fps,
    frame,
    config: springSmooth,
    delay: 8,
    durationInFrames: 36,
  });
  const dropGlow = interpolate(frame, [44, 58], [0, 1], {
    easing: EASING.enter,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const progress = interpolate(frame, [58, 90], [0, 1], {
    easing: EASING.enter,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width,
        height,
        background: backgroundColor,
        padding: `${safe.paddingTop}px ${safe.paddingRight}px ${safe.paddingBottom}px ${safe.paddingLeft}px`,
        display: "grid",
        placeItems: "center",
      }}
    >
      <div
        style={{
          width: "72%",
          maxWidth: 640,
          minHeight: 280,
          borderRadius: 24,
          border: `2px dashed ${dropGlow > 0.2 ? accentColor : COLORS.border}`,
          background: COLORS.panel,
          boxShadow: `0 0 ${40 * dropGlow}px ${accentColor}44`,
          display: "grid",
          placeItems: "center",
          gap: 16,
          position: "relative",
        }}
      >
        <div style={{ color: "#e2e8f0", fontSize: scaleFont(32, width), fontWeight: 600 }}>{label}</div>
        <div
          style={{
            opacity: drag,
            transform: `translate(${(1 - drag) * -120}px, ${(1 - drag) * 80}px)`,
            padding: "10px 16px",
            borderRadius: 12,
            background: "rgba(232,184,109,0.15)",
            border: `1px solid ${accentColor}66`,
            color: accentColor,
            fontSize: scaleFont(20, width),
          }}
        >
          {fileName}
        </div>
        <div
          style={{
            width: "68%",
            height: 8,
            borderRadius: 999,
            background: "rgba(255,255,255,0.08)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progress * 100}%`,
              height: "100%",
              background: accentColor,
              borderRadius: 999,
            }}
          />
        </div>
      </div>
      <SimulatedCursor
        points={[
          { x: 22, y: 78, frame: 0 },
          { x: 50, y: 52, frame: 30 },
          { x: 50, y: 52, frame: 50 },
        ]}
        clickFrames={[44]}
      />
    </div>
  );
};
