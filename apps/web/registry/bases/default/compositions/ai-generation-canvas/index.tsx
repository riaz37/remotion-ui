import { loadFont } from "@remotion/google-fonts/Inter";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";

const { fontFamily } = loadFont("normal", {
  weights: ["500", "600", "700"],
  subsets: ["latin"],
});

const ENTER_EASE = Easing.bezier(0.16, 1, 0.3, 1);
const DEMO_BG = "#080810";

export type AiGenerationMetric = {
  label: string;
  value: string;
  delta?: string;
};

export type AiGenerationCanvasProps = {
  prompt?: string;
  accentColor?: string;
  cardCount?: number;
  metrics?: AiGenerationMetric[];
  eyebrow?: string;
  statusLabel?: string;
  speed?: number;
};

const DEFAULT_METRICS: AiGenerationMetric[] = [
  { label: "Revenue", value: "$48.2k", delta: "+12.4%" },
  { label: "Active users", value: "12,840", delta: "+18.1%" },
  { label: "Sessions", value: "9.1k", delta: "+8.7%" },
  { label: "Conversion", value: "3.8%", delta: "+2.2%" },
  { label: "Retention", value: "76%", delta: "+5.4%" },
  { label: "Latency", value: "142ms", delta: "-11.8%" },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function fittedPromptSize(prompt: string, width: number, isPortrait: boolean) {
  const base = scaleFont(isPortrait ? 46 : 34, width);
  const longCopyAdjustment = prompt.length > 56 ? 0.78 : prompt.length > 36 ? 0.88 : 1;
  return Math.round(clamp(base * longCopyAdjustment, scaleFont(24, width), base));
}

const SparkIcon: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none">
    <path
      d="M12 2.6l2.58 6.82L21.4 12l-6.82 2.58L12 21.4l-2.58-6.82L2.6 12l6.82-2.58L12 2.6z"
      fill={color}
    />
  </svg>
);

const MiniBarChart: React.FC<{
  accentColor: string;
  scale: number;
  progress: number;
}> = ({ accentColor, scale, progress }) => {
  const bars = [0.42, 0.72, 0.56, 0.88, 0.5, 0.95, 0.66];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 8 * scale,
        height: 76 * scale,
        marginTop: 18 * scale,
      }}
    >
      {bars.map((height, index) => (
        <div
          key={index}
          style={{
            flex: 1,
            height: `${height * progress * 100}%`,
            minHeight: 4 * scale,
            background: `linear-gradient(180deg, ${accentColor}, ${accentColor}88)`,
            borderRadius: 999,
            opacity: 0.34 + height * 0.62,
          }}
        />
      ))}
    </div>
  );
};

const MiniRows: React.FC<{ scale: number; progress: number }> = ({
  scale,
  progress,
}) => (
  <div
    style={{
      marginTop: 18 * scale,
      display: "flex",
      flexDirection: "column",
      gap: 8 * scale,
    }}
  >
    {[0.9, 0.7, 0.84, 0.58].map((width, index) => (
      <div
        key={index}
        style={{
          height: 10 * scale,
          width: `${width * progress * 100}%`,
          background: "rgba(255,255,255,0.14)",
          borderRadius: 999,
        }}
      />
    ))}
  </div>
);

const SkeletonCard: React.FC<{
  accentColor: string;
  radius: number;
  scale: number;
  shimmer: number;
}> = ({ accentColor, radius, scale, shimmer }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: "rgba(16,16,24,0.88)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: radius,
      backfaceVisibility: "hidden",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `linear-gradient(110deg, transparent 0%, transparent ${shimmer}%, ${accentColor}24 ${shimmer + 16}%, transparent ${shimmer + 32}%)`,
      }}
    />
    <div style={{ padding: 24 * scale }}>
      <div
        style={{
          width: "42%",
          height: 12 * scale,
          background: "rgba(255,255,255,0.09)",
          borderRadius: 999,
        }}
      />
      <div
        style={{
          width: "72%",
          height: 34 * scale,
          background: "rgba(255,255,255,0.1)",
          borderRadius: 10 * scale,
          marginTop: 18 * scale,
        }}
      />
      <div
        style={{
          width: "100%",
          height: 82 * scale,
          background: "rgba(255,255,255,0.055)",
          borderRadius: 12 * scale,
          marginTop: 20 * scale,
        }}
      />
    </div>
  </div>
);

const MetricCard: React.FC<{
  accentColor: string;
  metric: AiGenerationMetric;
  index: number;
  progress: number;
  radius: number;
  scale: number;
}> = ({ accentColor, metric, index, progress, radius, scale }) => {
  const variant = index % 3;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "linear-gradient(180deg, rgba(24,24,34,0.96), rgba(12,12,18,0.96))",
        border: `1px solid ${accentColor}38`,
        borderRadius: radius,
        backfaceVisibility: "hidden",
        transform: "rotateY(180deg)",
        overflow: "hidden",
        boxShadow: `0 0 0 1px ${accentColor}14, 0 ${24 * scale}px ${70 * scale}px rgba(0,0,0,0.34)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 160 * scale,
          height: 160 * scale,
          right: -72 * scale,
          top: -72 * scale,
          borderRadius: 999,
          background: `${accentColor}18`,
          filter: `blur(${24 * scale}px)`,
        }}
      />
      <div
        style={{
          position: "relative",
          height: "100%",
          padding: 24 * scale,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              fontSize: scaleFont(20, scale * 1080),
              color: "rgba(255,255,255,0.58)",
              fontWeight: 600,
              fontFamily,
            }}
          >
            {metric.label}
          </div>
          <div
            style={{
              marginTop: 10 * scale,
              fontSize: scaleFont(58, scale * 1080),
              lineHeight: 1,
              fontWeight: 700,
              color: "white",
              fontFamily,
            }}
          >
            {metric.value}
          </div>
          {metric.delta ? (
            <div
              style={{
                marginTop: 10 * scale,
                fontSize: scaleFont(19, scale * 1080),
                color: accentColor,
                fontWeight: 700,
              }}
            >
              {metric.delta} this week
            </div>
          ) : null}
        </div>
        {variant === 0 ? (
          <MiniBarChart accentColor={accentColor} scale={scale} progress={progress} />
        ) : variant === 1 ? (
          <MiniRows scale={scale} progress={progress} />
        ) : (
          <div>
            <MiniBarChart
              accentColor={accentColor}
              scale={scale}
              progress={progress}
            />
            <MiniRows scale={scale} progress={progress} />
          </div>
        )}
      </div>
    </div>
  );
};

export const AiGenerationCanvas: React.FC<AiGenerationCanvasProps> = ({
  prompt = "Generate a revenue dashboard for this launch",
  accentColor = "#e8b86d",
  cardCount = 4,
  metrics = DEFAULT_METRICS,
  eyebrow = "AI generation canvas",
  statusLabel = "Generating",
  speed = 1,
}) => {
  const rawFrame = useCurrentFrame();
  const frame = rawFrame * speed;
  const { fps, width, height } = useVideoConfig();
  const safe = getSafeAreaPadding({ width, height });
  const isPortrait = height > width;
  const scale = width / 1920;
  const safeWidth = width - safe.paddingLeft - safe.paddingRight;

  const promptEnd = 44;
  const morphEnd = 78;
  const skeletonEnd = 104;
  const normalizedCardCount = clamp(Math.round(cardCount), 1, 6);
  const visibleMetrics = Array.from({ length: normalizedCardCount }, (_, index) => {
    return metrics[index % metrics.length] ?? DEFAULT_METRICS[index % DEFAULT_METRICS.length];
  });

  const typedCount = Math.floor(
    interpolate(frame, [6, promptEnd - 4], [0, prompt.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    }),
  );
  const typedText = prompt.slice(0, typedCount);
  const cursorVisible = Math.floor(frame / 12) % 2 === 0;

  const morph = spring({
    frame: frame - promptEnd,
    fps,
    config: { mass: 1, damping: 17, stiffness: 118 },
    durationInFrames: morphEnd - promptEnd,
  });

  const dashboardEnter = interpolate(frame, [morphEnd - 8, skeletonEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ENTER_EASE,
  });
  const backgroundPulse = interpolate(
    rawFrame % 120,
    [0, 60, 120],
    [0.74, 1, 0.74],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const shimmer = ((frame * 1.35) % 180) - 38;

  const promptSize = fittedPromptSize(prompt, width, isPortrait);
  const headerPromptSize = scaleFont(isPortrait ? 24 : 18, width);
  const inputHeight = interpolate(
    morph,
    [0, 1],
    [scaleFont(isPortrait ? 132 : 106, width), scaleFont(isPortrait ? 76 : 62, width)],
  );
  const inputWidth = interpolate(
    morph,
    [0, 1],
    [Math.min(safeWidth, scaleFont(isPortrait ? 860 : 760, width)), safeWidth],
  );
  const inputFontSize = interpolate(morph, [0, 1], [promptSize, headerPromptSize]);
  const inputRadius = interpolate(
    morph,
    [0, 1],
    [scaleFont(22, width), scaleFont(16, width)],
  );
  const inputTranslateY = interpolate(
    morph,
    [0, 1],
    [isPortrait ? height * 0.27 : height * 0.3, 0],
  );
  const dashboardTranslate = interpolate(
    dashboardEnter,
    [0, 1],
    [scaleFont(34, width), 0],
  );

  const columns = isPortrait
    ? Math.min(2, normalizedCardCount)
    : Math.min(normalizedCardCount, 4);
  const radius = scaleFont(isPortrait ? 26 : 20, width);
  const cardMinHeight = scaleFont(isPortrait ? 250 : 270, width);
  const cardGap = scaleFont(isPortrait ? 22 : 24, width);

  return (
    <AbsoluteFill
      style={{
        background: DEMO_BG,
        overflow: "hidden",
        fontFamily,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.032) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.032) 1px, transparent 1px)",
          backgroundSize: `${scaleFont(isPortrait ? 46 : 44, width)}px ${scaleFont(isPortrait ? 46 : 44, width)}px`,
          maskImage:
            "radial-gradient(ellipse at center, black 36%, transparent 78%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: scaleFont(isPortrait ? 680 : 820, width),
          height: scaleFont(isPortrait ? 680 : 820, width),
          right: -scaleFont(isPortrait ? 250 : 180, width),
          top: -scaleFont(isPortrait ? 150 : 220, width),
          borderRadius: 999,
          background: `${accentColor}24`,
          filter: `blur(${scaleFont(90, width)}px)`,
          opacity: backgroundPulse,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: scaleFont(isPortrait ? 520 : 620, width),
          height: scaleFont(isPortrait ? 520 : 620, width),
          left: -scaleFont(isPortrait ? 210 : 140, width),
          bottom: -scaleFont(isPortrait ? 160 : 190, width),
          borderRadius: 999,
          background: "rgba(45,212,191,0.16)",
          filter: `blur(${scaleFont(100, width)}px)`,
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          height: "100%",
          paddingTop: safe.paddingTop,
          paddingRight: safe.paddingRight,
          paddingBottom: safe.paddingBottom,
          paddingLeft: safe.paddingLeft,
          display: "flex",
          flexDirection: "column",
          gap: scaleFont(isPortrait ? 34 : 30, width),
        }}
      >
        <div
          style={{
            minHeight: inputHeight,
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              width: inputWidth,
              height: inputHeight,
              transform: `translateY(${inputTranslateY}px)`,
              background: "rgba(18,18,25,0.84)",
              border: `1px solid ${accentColor}66`,
              borderRadius: inputRadius,
              backdropFilter: "blur(18px)",
              display: "flex",
              alignItems: morph > 0.5 ? "center" : "flex-start",
              padding: `0 ${scaleFont(isPortrait ? 24 : 22, width)}px`,
              boxShadow:
                morph < 0.5
                  ? `0 0 0 ${scaleFont(8, width)}px ${accentColor}12, 0 ${scaleFont(34, width)}px ${scaleFont(100, width)}px rgba(0,0,0,0.52)`
                  : `0 ${scaleFont(10, width)}px ${scaleFont(32, width)}px rgba(0,0,0,0.36)`,
            }}
          >
            <div
              style={{
                width: scaleFont(isPortrait ? 36 : 28, width),
                height: scaleFont(isPortrait ? 36 : 28, width),
                marginTop: morph > 0.5 ? 0 : scaleFont(24, width),
                marginRight: scaleFont(16, width),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <SparkIcon size={scaleFont(isPortrait ? 31 : 24, width)} color={accentColor} />
            </div>
            <div
              style={{
                minWidth: 0,
                color: "white",
                fontSize: inputFontSize,
                lineHeight: 1.15,
                fontWeight: 600,
                paddingTop: morph > 0.5 ? 0 : scaleFont(22, width),
                textOverflow: "ellipsis",
                whiteSpace: morph > 0.7 ? "nowrap" : "normal",
              }}
            >
              {typedText}
              {frame < promptEnd && cursorVisible ? (
                <span
                  style={{
                    display: "inline-block",
                    width: Math.max(2, scaleFont(3, width)),
                    height: inputFontSize,
                    background: accentColor,
                    marginLeft: scaleFont(4, width),
                    verticalAlign: "middle",
                  }}
                />
              ) : null}
            </div>
            <div
              style={{
                marginLeft: "auto",
                display: "flex",
                gap: scaleFont(10, width),
                alignItems: "center",
                opacity: interpolate(morph, [0.58, 1], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: scaleFont(10, width),
                  height: scaleFont(10, width),
                  borderRadius: 999,
                  background: accentColor,
                  boxShadow: `0 0 ${scaleFont(18, width)}px ${accentColor}`,
                }}
              />
              <div
                style={{
                  fontSize: scaleFont(isPortrait ? 20 : 16, width),
                  color: "rgba(255,255,255,0.66)",
                  fontWeight: 700,
                }}
              >
                {statusLabel}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            opacity: dashboardEnter,
            transform: `translateY(${dashboardTranslate}px)`,
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            gap: scaleFont(isPortrait ? 22 : 20, width),
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: isPortrait ? "flex-start" : "flex-end",
              justifyContent: "space-between",
              gap: scaleFont(24, width),
              flexDirection: isPortrait ? "column" : "row",
            }}
          >
            <div>
              <div
                style={{
                  color: accentColor,
                  fontSize: scaleFont(isPortrait ? 24 : 18, width),
                  fontWeight: 700,
                }}
              >
                {eyebrow}
              </div>
              <div
                style={{
                  marginTop: scaleFont(8, width),
                  color: "white",
                  fontSize: scaleFont(isPortrait ? 48 : 42, width),
                  lineHeight: 1.04,
                  fontWeight: 700,
                  maxWidth: isPortrait ? safeWidth : safeWidth * 0.62,
                }}
              >
                Live metrics from one prompt
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: scaleFont(12, width),
                color: "rgba(255,255,255,0.68)",
                fontSize: scaleFont(isPortrait ? 22 : 18, width),
                fontWeight: 600,
              }}
            >
              <div
                style={{
                  width: scaleFont(9, width),
                  height: scaleFont(9, width),
                  borderRadius: 999,
                  background: "#2dd4bf",
                  boxShadow: `0 0 ${scaleFont(16, width)}px #2dd4bf`,
                }}
              />
              Analysis ready
            </div>
          </div>

          <div
            style={{
              flex: 1,
              minHeight: 0,
              display: "grid",
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              gridAutoRows: `minmax(${cardMinHeight}px, 1fr)`,
              gap: cardGap,
            }}
          >
            {visibleMetrics.map((metric, index) => {
              const cardStart = skeletonEnd + index * 7;
              const cardSpring = spring({
                frame: frame - cardStart,
                fps,
                config: { mass: 0.9, damping: 15, stiffness: 112 },
                durationInFrames: 28,
              });
              const rotation = interpolate(cardSpring, [0, 1], [0, 180]);
              const cardProgress = interpolate(cardSpring, [0.45, 1], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: ENTER_EASE,
              });

              return (
                <div
                  key={`${metric.label}-${index}`}
                  style={{
                    position: "relative",
                    perspective: scaleFont(1300, width),
                    opacity: dashboardEnter,
                    minHeight: cardMinHeight,
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      height: "100%",
                      transformStyle: "preserve-3d",
                      transform: `rotateY(${rotation}deg)`,
                    }}
                  >
                    <SkeletonCard
                      accentColor={accentColor}
                      radius={radius}
                      scale={scale}
                      shimmer={shimmer}
                    />
                    <MetricCard
                      accentColor={accentColor}
                      metric={metric}
                      index={index}
                      progress={cardProgress}
                      radius={radius}
                      scale={scale}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
