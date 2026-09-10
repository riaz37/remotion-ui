import { loadFont } from "@remotion/google-fonts/Inter";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { EASING } from "@/remotion/lib/motion-tokens";
import { springSnappy } from "@/remotion/lib/springs";

const { fontFamily } = loadFont("normal", {
  weights: ["500", "600", "700"],
  subsets: ["latin"],
});

export type InstalledPreviewProps = {
  value?: number;
  label?: string;
  eyebrow?: string;
  accentColor?: string;
  backgroundColor?: string;
};

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/**
 * The "it's actually playing" beat nested inside `DeviceMockupZoom`'s browser
 * screen. Registry scenes like `StatCard` size themselves off the full
 * composition's `useVideoConfig()` dimensions, which is correct for a
 * full-bleed scene but wrong here: `DeviceMockupZoom` hands its `children` a
 * screen box that is a fraction of the stage, sized by CSS
 * (`flex: 1`/`overflow: hidden`) rather than measured and passed down. A
 * full-stage component dropped in unscaled renders oversized and gets
 * cropped to whatever corner happens to sit under the screen box. This scene
 * is written to fill `100%`/`100%` of its actual DOM parent instead of the
 * composition's pixel size, so it sits correctly inside the device frame at
 * any screen-box size without a client-side measurement pass (which would
 * mean `delayRender` per frame — the exact trap already hit once on the map
 * scenes).
 */
export const InstalledPreview: React.FC<InstalledPreviewProps> = ({
  value = 200,
  label = "components in your repo",
  eyebrow = "social-clip.tsx",
  accentColor = "#E8B86D",
  backgroundColor = "#0B0C11",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 130, mass: 0.85 },
  });
  const chipIn = interpolate(frame, [4, 16], [0, 1], {
    easing: EASING.enter,
    ...clamp,
  });
  const countProgress = spring({
    frame: frame - 12,
    fps,
    config: springSnappy,
    durationInFrames: 34,
  });
  const displayValue = Math.round(
    Math.min(1, Math.max(0, countProgress)) * value,
  );
  const labelIn = interpolate(frame, [30, 42], [0, 1], {
    easing: EASING.enter,
    ...clamp,
  });
  const pulse = interpolate(frame % 90, [0, 45, 90], [0.35, 0.75, 0.35]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: backgroundColor,
        fontFamily,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: "60%",
          aspectRatio: "1",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accentColor}30, transparent 70%)`,
          opacity: pulse,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
          opacity: enter,
          scale: `${interpolate(enter, [0, 1], [0.92, 1])}`,
        }}
      >
        <div
          style={{
            padding: "6px 14px",
            borderRadius: 999,
            background: `${accentColor}20`,
            border: `1px solid ${accentColor}60`,
            color: accentColor,
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: "0.04em",
            opacity: chipIn,
          }}
        >
          {eyebrow}
        </div>

        <div
          style={{
            fontSize: 88,
            lineHeight: 1,
            fontWeight: 700,
            color: "#F4F4F5",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {displayValue}
        </div>

        <div
          style={{
            fontSize: 20,
            fontWeight: 500,
            color: "#B8BCC4",
            opacity: labelIn,
            translate: `0 ${(1 - labelIn) * 6}px`,
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
};
