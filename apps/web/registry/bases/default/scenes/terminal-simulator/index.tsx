import { loadFont } from "@remotion/google-fonts/Inter";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { DELAY, DURATION, EASING, STAGGER } from "@/remotion/lib/motion-tokens";

const { fontFamily } = loadFont("normal", {
  weights: ["500", "600", "700"],
  subsets: ["latin"],
});

export type TerminalLine = {
  text: string;
  tone?: "default" | "success" | "muted" | "accent";
};

export type TerminalSimulatorProps = {
  lines?: TerminalLine[];
  title?: string;
  backgroundColor?: string;
  accentColor?: string;
};

const COLORS = {
  bg: "#080810",
  panel: "rgba(10,12,20,0.96)",
  border: "rgba(148,163,184,0.14)",
  title: "#e2e8f0",
  default: "#e2e8f0",
  success: "#2dd4bf",
  muted: "#64748b",
  accent: "#e8b86d",
  chrome: ["#f87171", "#fbbf24", "#34d399"],
} as const;

const DEFAULT_LINES: TerminalLine[] = [
  { text: "$ pnpm registry:build", tone: "accent" },
  { text: "▸ resolving registry items…", tone: "muted" },
  { text: "✓ built 6 scene blocks", tone: "success" },
  { text: "✓ emitted public registry JSON", tone: "success" },
  { text: "done in 4.2s", tone: "default" },
];

function lineColor(tone: TerminalLine["tone"], accentColor: string): string {
  switch (tone) {
    case "success":
      return COLORS.success;
    case "muted":
      return COLORS.muted;
    case "accent":
      return accentColor;
    default:
      return COLORS.default;
  }
}

export const TerminalSimulator: React.FC<TerminalSimulatorProps> = ({
  lines = DEFAULT_LINES,
  title = "Build output",
  backgroundColor = COLORS.bg,
  accentColor = COLORS.accent,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const safe = getSafeAreaPadding({ width, height });
  const monoFamily = "ui-monospace, SFMono-Regular, Menlo, monospace";
  const panelEnter = interpolate(frame, [0, DURATION.fast], [0, 1], {
    easing: EASING.enter,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleEnter = interpolate(
    frame,
    [DELAY.short, DELAY.short + DURATION.fast],
    [0, 1],
    {
      easing: EASING.enter,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const progress = interpolate(
    frame,
    [STAGGER.normal, STAGGER.normal + DURATION.slow],
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
        paddingLeft: safe.paddingLeft,
        paddingRight: safe.paddingRight,
        paddingTop: safe.paddingTop,
        paddingBottom: safe.paddingBottom,
        background: `radial-gradient(circle at 18% 12%, ${accentColor}22, transparent 34%), ${backgroundColor}`,
        fontFamily,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 90% 35% at 50% 0%, ${accentColor}18, transparent 72%)`,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          borderRadius: scaleFont(18, width),
          background: COLORS.panel,
          border: `1px solid ${COLORS.border}`,
          overflow: "hidden",
          opacity: panelEnter,
          transform: `translateY(${(1 - panelEnter) * scaleFont(20, width)}px)`,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.12), 0 ${scaleFont(28, width)}px ${scaleFont(80, width)}px rgba(0,0,0,0.42)`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: scaleFont(10, width),
            padding: `${scaleFont(16, width)}px ${scaleFont(20, width)}px`,
            borderBottom: `1px solid ${COLORS.border}`,
            background: "rgba(255,255,255,0.03)",
          }}
        >
          {COLORS.chrome.map((color) => (
            <div
              key={color}
              style={{
                width: scaleFont(12, width),
                height: scaleFont(12, width),
                borderRadius: "50%",
                background: color,
                opacity: titleEnter,
              }}
            />
          ))}
          <div
            style={{
              marginLeft: "auto",
              color: COLORS.muted,
              fontSize: scaleFont(18, width),
              fontWeight: 600,
              opacity: titleEnter,
            }}
          >
            {title}
          </div>
        </div>
        <div
          style={{
            padding: scaleFont(24, width),
            display: "grid",
            gap: scaleFont(12, width),
            fontFamily: monoFamily,
            fontSize: scaleFont(22, width),
            lineHeight: 1.45,
          }}
        >
          {lines.map((line, index) => {
            const delay = STAGGER.normal + index * STAGGER.tight;
            const visible = interpolate(
              frame,
              [delay, delay + DURATION.fast],
              [0, 1],
              {
                easing: EASING.enter,
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              },
            );

            return (
              <div
                key={`${line.text}-${index}`}
                style={{
                  color: lineColor(line.tone, accentColor),
                  opacity: visible,
                  transform: `translateX(${(1 - visible) * scaleFont(-12, width)}px)`,
                }}
              >
                {line.text}
              </div>
            );
          })}
        </div>
        <div
          style={{
            margin: `0 ${scaleFont(24, width)}px ${scaleFont(24, width)}px`,
            height: scaleFont(6, width),
            borderRadius: 999,
            background: "rgba(255,255,255,0.06)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progress * 100}%`,
              height: "100%",
              borderRadius: 999,
              background: `linear-gradient(90deg, ${accentColor}, ${COLORS.success})`,
              boxShadow: `0 0 ${scaleFont(16, width)}px ${accentColor}66`,
            }}
          />
        </div>
      </div>
    </div>
  );
};
