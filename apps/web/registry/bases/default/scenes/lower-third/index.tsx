import { loadFont } from "@remotion/google-fonts/Inter";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { DURATION, EASING, STAGGER } from "@/remotion/lib/motion-tokens";

const { fontFamily } = loadFont("normal", {
  weights: ["500", "700"],
  subsets: ["latin"],
});

export type LowerThirdProps = {
  title: string;
  subtitle?: string;
  accentColor?: string;
  backgroundColor?: string;
};

const COLORS = {
  bar: "rgba(8,8,16,0.92)",
  title: "#f8fafc",
  subtitle: "#a1a1aa",
  accent: "#e8b86d",
  scrim: "rgba(8,8,16,0.88)",
} as const;

export const LowerThird: React.FC<LowerThirdProps> = ({
  title,
  subtitle,
  accentColor = COLORS.accent,
  backgroundColor = "transparent",
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const safeArea = getSafeAreaPadding({ width, height });
  const contentWidth = width - safeArea.paddingLeft - safeArea.paddingRight;
  const maxBarWidth = Math.min(contentWidth * 0.82, scaleFont(920, width));
  const bottomSlot = Math.max(
    safeArea.paddingBottom,
    Math.round(height * 0.12),
  );

  const scrimColor =
    backgroundColor === "transparent"
      ? COLORS.scrim
      : `${backgroundColor}e0`;

  const titleEnter = interpolate(frame, [0, DURATION.fast], [0, 1], {
    easing: EASING.enter,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const accentDraw = interpolate(frame, [0, DURATION.fast], [0, 1], {
    easing: EASING.enter,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subtitleEnter = interpolate(
    frame,
    [STAGGER.normal, STAGGER.normal + DURATION.fast],
    [0, 1],
    {
      easing: EASING.enter,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  return (
    <div
      style={{
        width,
        height,
        position: "relative",
        backgroundColor: "transparent",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "40%",
          background: `linear-gradient(to top, ${scrimColor} 0%, transparent 100%)`,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: safeArea.paddingLeft,
          right: safeArea.paddingRight,
          bottom: bottomSlot,
          display: "flex",
          flexDirection: "column",
          gap: scaleFont(10, width),
          maxWidth: maxBarWidth,
          fontFamily,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            borderRadius: scaleFont(6, width),
            overflow: "hidden",
            boxShadow: `0 ${scaleFont(8, width)}px ${scaleFont(24, width)}px rgba(0,0,0,0.4)`,
            opacity: titleEnter,
            transform: `translateX(${(1 - titleEnter) * -40}px)`,
            maxWidth: "100%",
          }}
        >
          <div
            style={{
              width: scaleFont(5, width),
              alignSelf: "stretch",
              backgroundColor: accentColor,
              flexShrink: 0,
              transform: `scaleY(${accentDraw})`,
              transformOrigin: "top center",
            }}
          />
          <div
            style={{
              backgroundColor: COLORS.bar,
              color: COLORS.title,
              padding: `${scaleFont(14, width)}px ${scaleFont(22, width)}px`,
              fontSize: scaleFont(36, width),
              fontWeight: 700,
              lineHeight: 1.15,
              flex: 1,
              minWidth: 0,
              wordBreak: "break-word",
            }}
          >
            {title}
          </div>
        </div>
        {subtitle ? (
          <p
            style={{
              color: COLORS.subtitle,
              fontSize: scaleFont(28, width),
              margin: 0,
              paddingLeft: scaleFont(12, width),
              fontWeight: 500,
              textShadow: "0 2px 8px rgba(0,0,0,0.5)",
              opacity: subtitleEnter,
              transform: `translateX(${(1 - subtitleEnter) * -32}px)`,
              maxWidth: maxBarWidth,
              wordBreak: "break-word",
            }}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
};
