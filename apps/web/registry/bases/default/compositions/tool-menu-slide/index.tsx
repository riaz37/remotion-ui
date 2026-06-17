import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { EASING_ENTER } from "@/remotion/lib/timing";

const ITEMS = ["Components", "Recipes", "Render queue", "Docs"];

export const ToolMenuSlide: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const safe = getSafeAreaPadding({ width, height });

  return (
    <AbsoluteFill style={{ background: "#080810" }}>
      <div
        style={{
          position: "absolute",
          left: safe.paddingLeft,
          top: safe.paddingTop + 40,
          width: 260,
          display: "grid",
          gap: 10,
        }}
      >
        {ITEMS.map((item, i) => {
          const slide = interpolate(frame, [i * 6, i * 6 + 18], [-120, 0], {
            easing: EASING_ENTER,
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const opacity = interpolate(frame, [i * 6, i * 6 + 12], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div
              key={item}
              style={{
                padding: "12px 16px",
                borderRadius: 12,
                background: "rgba(12,16,24,0.94)",
                border: "1px solid rgba(148,163,184,0.14)",
                color: "#e2e8f0",
                fontSize: scaleFont(22, width),
                transform: `translateX(${slide}px)`,
                opacity,
              }}
            >
              {item}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
