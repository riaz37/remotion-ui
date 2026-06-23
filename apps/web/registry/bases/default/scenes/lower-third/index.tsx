import { loadFont } from "@remotion/google-fonts/Inter";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { DURATION, EASING, STAGGER } from "@/remotion/lib/motion-tokens";

const { fontFamily } = loadFont("normal", {
  weights: ["500", "600", "700", "800"],
  subsets: ["latin"],
});

export type LowerThirdProps = {
  title: string;
  subtitle?: string;
  accentColor?: string;
  backgroundColor?: string;
  align?: "left" | "right";
};

const COLORS = {
  panel: "rgba(5, 7, 15, 0.78)",
  panelSolid: "#080810",
  border: "rgba(255, 255, 255, 0.12)",
  title: "#f8fafc",
  subtitle: "#cbd5e1",
  muted: "#94a3b8",
  accent: "#e8b86d",
} as const;

const enter = (frame: number, from: number, to: number) =>
  interpolate(frame, [from, to], [0, 1], {
    easing: EASING.enter,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

export const LowerThird: React.FC<LowerThirdProps> = ({
  title,
  subtitle,
  accentColor = COLORS.accent,
  backgroundColor = COLORS.panel,
  align = "left",
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const safeArea = getSafeAreaPadding({ width, height });
  const isRight = align === "right";

  const panelEnter = enter(frame, 0, DURATION.fast);
  const railEnter = enter(frame, STAGGER.tight, DURATION.fast + STAGGER.tight);
  const textEnter = enter(frame, STAGGER.normal, DURATION.fast + STAGGER.normal);
  const subtitleEnter = enter(
    frame,
    STAGGER.normal * 2,
    DURATION.fast + STAGGER.normal * 2,
  );

  const maxWidth = Math.min(
    width - safeArea.paddingLeft - safeArea.paddingRight,
    scaleFont(720, width),
  );
  const railWidth = scaleFont(6, width);

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          paddingLeft: safeArea.paddingLeft,
          paddingRight: safeArea.paddingRight,
          paddingTop: safeArea.paddingTop,
          paddingBottom: Math.max(safeArea.paddingBottom, scaleFont(76, width)),
          display: "flex",
          alignItems: "flex-end",
          justifyContent: isRight ? "flex-end" : "flex-start",
          fontFamily,
        }}
      >
        <div
          style={{
            width: maxWidth,
            display: "flex",
            flexDirection: isRight ? "row-reverse" : "row",
            alignItems: "stretch",
            opacity: panelEnter,
            translate: `${(1 - panelEnter) * (isRight ? 48 : -48)}px 0px`,
            scale: 0.985 + panelEnter * 0.015,
          }}
        >
          <div
            style={{
              width: railWidth,
              borderRadius: 999,
              background: accentColor,
              boxShadow: `0 0 ${scaleFont(28, width)}px ${accentColor}66`,
              scale: `1 ${railEnter}`,
              transformOrigin: "bottom center",
              flexShrink: 0,
            }}
          />
          <div
            style={{
              minWidth: 0,
              maxWidth: "100%",
              marginLeft: isRight ? 0 : scaleFont(12, width),
              marginRight: isRight ? scaleFont(12, width) : 0,
              borderRadius: scaleFont(18, width),
              background:
                backgroundColor === "transparent"
                  ? COLORS.panel
                  : backgroundColor,
              border: `1px solid ${COLORS.border}`,
              boxShadow: `0 ${scaleFont(22, width)}px ${scaleFont(54, width)}px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)`,
              padding: `${scaleFont(18, width)}px ${scaleFont(26, width)}px`,
              display: "flex",
              flexDirection: "column",
              gap: subtitle ? scaleFont(6, width) : 0,
              overflow: "hidden",
              textAlign: isRight ? "right" : "left",
            }}
          >
            <div
              style={{
                color: COLORS.title,
                fontSize: scaleFont(34, width),
                lineHeight: 1.05,
                fontWeight: 800,
                opacity: textEnter,
                translate: `${(1 - textEnter) * (isRight ? 18 : -18)}px 0px`,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {title}
            </div>
            {subtitle ? (
              <div
                style={{
                  color: COLORS.subtitle,
                  fontSize: scaleFont(22, width),
                  lineHeight: 1.18,
                  fontWeight: 600,
                  opacity: subtitleEnter,
                  translate: `${(1 - subtitleEnter) * (isRight ? 14 : -14)}px 0px`,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {subtitle}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
