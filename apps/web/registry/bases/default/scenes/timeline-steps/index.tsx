import { loadFont } from "@remotion/google-fonts/Inter";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { DELAY, DURATION, EASING, STAGGER } from "@/remotion/lib/motion-tokens";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "700"],
  subsets: ["latin"],
});

export type TimelineStep = {
  title: string;
  description?: string;
};

export type TimelineStepsProps = {
  steps: TimelineStep[];
  title?: string;
  backgroundColor?: string;
  accentColor?: string;
};

const COLORS = {
  bg: "#080810",
  text: "#f4f4f5",
  muted: "#a1a1aa",
  accent: "#f59e0b",
} as const;

export const TimelineSteps: React.FC<TimelineStepsProps> = ({
  steps,
  title,
  backgroundColor = COLORS.bg,
  accentColor = COLORS.accent,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const safe = getSafeAreaPadding({ width, height });
  const visibleSteps = steps.slice(0, 4);
  const nodeSize = scaleFont(52, width);
  const titleEnter = interpolate(frame, [0, DURATION.fast], [0, 1], {
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
        color: COLORS.text,
        paddingLeft: safe.paddingLeft,
        paddingRight: safe.paddingRight,
        paddingTop: safe.paddingTop,
        paddingBottom: safe.paddingBottom,
        fontFamily,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: scaleFont(48, width),
      }}
    >
      {title ? (
        <h2
          style={{
            margin: 0,
            fontSize: scaleFont(84, width),
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            opacity: titleEnter,
            transform: `translateY(${(1 - titleEnter) * 16}px)`,
          }}
        >
          {title}
        </h2>
      ) : null}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 0,
        }}
      >
        {visibleSteps.map((step, index) => {
          const delay = index * STAGGER.relaxed;
          const nodeEnter = interpolate(
            frame,
            [delay, delay + DURATION.fast],
            [0, 1],
            {
              easing: EASING.enter,
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          );
          const connectorDraw = interpolate(
            frame,
            [delay + DURATION.fast, delay + DURATION.fast + DURATION.normal],
            [0, 1],
            {
              easing: EASING.enter,
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          );
          const textEnter = interpolate(
            frame,
            [delay + DELAY.short, delay + DELAY.short + DURATION.fast],
            [0, 1],
            {
              easing: EASING.enter,
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          );
          const isLast = index === visibleSteps.length - 1;

          return (
            <div
              key={step.title}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                minWidth: 0,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  width: "100%",
                }}
              >
                <div
                  style={{
                    width: nodeSize,
                    height: nodeSize,
                    flexShrink: 0,
                    borderRadius: "50%",
                    background: accentColor,
                    color: "#0c0f14",
                    display: "grid",
                    placeItems: "center",
                    fontSize: scaleFont(26, width),
                    fontWeight: 700,
                    opacity: nodeEnter,
                    transform: `scale(${0.85 + nodeEnter * 0.15})`,
                  }}
                >
                  {index + 1}
                </div>
                {!isLast ? (
                  <div
                    style={{
                      flex: 1,
                      height: 3,
                      marginLeft: 8,
                      marginRight: 8,
                      borderRadius: 999,
                      background: accentColor,
                      opacity: 0.45,
                      transformOrigin: "left center",
                      transform: `scaleX(${connectorDraw})`,
                    }}
                  />
                ) : null}
              </div>
              <div
                style={{
                  marginTop: scaleFont(22, width),
                  paddingRight: index < visibleSteps.length - 1 ? 12 : 0,
                  opacity: textEnter,
                  transform: `translateY(${(1 - textEnter) * 20}px)`,
                }}
              >
                <div
                  style={{
                    fontSize: scaleFont(32, width),
                    fontWeight: 700,
                    lineHeight: 1.15,
                  }}
                >
                  {step.title}
                </div>
                {step.description ? (
                  <div
                    style={{
                      color: COLORS.muted,
                      fontSize: scaleFont(24, width),
                      marginTop: scaleFont(10, width),
                      lineHeight: 1.35,
                    }}
                  >
                    {step.description}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
