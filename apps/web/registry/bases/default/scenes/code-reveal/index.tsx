import { loadFont } from "@remotion/google-fonts/Inter";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { DURATION, EASING, STAGGER } from "@/remotion/lib/motion-tokens";

const { fontFamily } = loadFont("normal", {
  weights: ["600", "700"],
  subsets: ["latin"],
});

export type CodeRevealProps = {
  code: string;
  highlightedLines?: number[];
  title?: string;
  backgroundColor?: string;
  accentColor?: string;
};

const COLORS = {
  bg: "#080810",
  panel: "rgba(12,16,24,0.94)",
  border: "rgba(148,163,184,0.16)",
  title: "#e2e8f0",
  line: "#e2e8f0",
  gutter: "#64748b",
  accent: "#2dd4bf",
  cursor: "#e8b86d",
} as const;

export const CodeReveal: React.FC<CodeRevealProps> = ({
  code,
  highlightedLines = [],
  title,
  backgroundColor = COLORS.bg,
  accentColor = COLORS.accent,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const safeArea = getSafeAreaPadding({ width, height });
  const lines = code.trim().split("\n");
  const monoFamily = "ui-monospace, SFMono-Regular, Menlo, monospace";
  const lineBaseDelay = title ? STAGGER.normal + DURATION.fast : STAGGER.normal;
  const lastLineDelay = lineBaseDelay + (lines.length - 1) * STAGGER.tight;
  const showCursor = frame >= lastLineDelay;
  const cursorVisible = frame % 30 < 15;
  const titleProgress = title
    ? interpolate(frame, [0, DURATION.fast], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: EASING.enter,
      })
    : 0;

  return (
    <div
      style={{
        width,
        height,
        paddingLeft: safeArea.paddingLeft,
        paddingRight: safeArea.paddingRight,
        paddingTop: safeArea.paddingTop,
        paddingBottom: safeArea.paddingBottom,
        background: backgroundColor,
        color: COLORS.title,
        fontFamily,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          borderRadius: scaleFont(18, width),
          background: COLORS.panel,
          border: `1px solid ${COLORS.border}`,
          overflow: "hidden",
        }}
      >
        {title ? (
          <h2
            style={{
              margin: 0,
              padding: `${scaleFont(22, width)}px ${scaleFont(24, width)}px 0`,
              fontSize: scaleFont(44, width),
              lineHeight: 1.05,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              opacity: titleProgress,
              transform: `translateY(${(1 - titleProgress) * 14}px)`,
            }}
          >
            {title}
          </h2>
        ) : null}
        <pre
          style={{
            margin: 0,
            padding: title
              ? `${scaleFont(16, width)}px ${scaleFont(24, width)}px ${scaleFont(24, width)}px`
              : scaleFont(24, width),
            fontFamily: monoFamily,
            fontSize: scaleFont(24, width),
            lineHeight: 1.55,
            overflow: "hidden",
          }}
        >
        {lines.map((line, index) => {
          const lineStart = lineBaseDelay + index * STAGGER.tight;
          const visible = interpolate(
            frame,
            [lineStart, lineStart + DURATION.fast],
            [0, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: EASING.enter,
            },
          );
          const highlighted = highlightedLines.includes(index + 1);
          const isLastLine = index === lines.length - 1;

          return (
            <div
              key={`${line}-${index}`}
              style={{
                opacity: visible,
                color: highlighted ? accentColor : COLORS.line,
                background: highlighted ? `${accentColor}16` : "transparent",
                padding: `0 ${scaleFont(8, width)}px`,
                borderRadius: scaleFont(6, width),
              }}
            >
              <span
                style={{
                  color: COLORS.gutter,
                  marginRight: scaleFont(16, width),
                  userSelect: "none",
                }}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              {line}
              {isLastLine && showCursor ? (
                <span
                  style={{
                    color: COLORS.cursor,
                    opacity: cursorVisible ? 1 : 0,
                    marginLeft: scaleFont(2, width),
                  }}
                >
                  ▍
                </span>
              ) : null}
            </div>
          );
        })}
        </pre>
      </div>
    </div>
  );
};
