import { loadFont } from "@remotion/google-fonts/Inter";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { STAGGER } from "@/remotion/lib/motion-tokens";

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
  bg: "#0a0c12",
  panel: "rgba(12,16,24,0.94)",
  border: "rgba(148,163,184,0.16)",
  title: "#e2e8f0",
  line: "#e2e8f0",
  gutter: "#64748b",
  accent: "#22d3ee",
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
        gap: scaleFont(24, width),
        justifyContent: "center",
      }}
    >
      {title ? (
        <h2
          style={{
            margin: 0,
            fontSize: scaleFont(44, width),
            lineHeight: 1.05,
            fontWeight: 700,
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </h2>
      ) : null}
      <pre
        style={{
          margin: 0,
          borderRadius: scaleFont(18, width),
          padding: scaleFont(24, width),
          background: COLORS.panel,
          border: `1px solid ${COLORS.border}`,
          fontFamily: monoFamily,
          fontSize: scaleFont(24, width),
          lineHeight: 1.55,
          overflow: "hidden",
        }}
      >
        {lines.map((line, index) => {
          const visible = interpolate(
            frame,
            [index * STAGGER.tight, index * STAGGER.tight + STAGGER.normal],
            [0, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          );
          const highlighted = highlightedLines.includes(index + 1);

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
            </div>
          );
        })}
      </pre>
    </div>
  );
};
