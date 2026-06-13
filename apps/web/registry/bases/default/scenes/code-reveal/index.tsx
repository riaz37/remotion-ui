import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { getSafePadding } from "@/remotion/lib/layout";

export type CodeRevealProps = {
  code: string;
  highlightedLines?: number[];
  title?: string;
  backgroundColor?: string;
  accentColor?: string;
};

export const CodeReveal: React.FC<CodeRevealProps> = ({
  code,
  highlightedLines = [],
  title = "Drop in the component",
  backgroundColor = "#020617",
  accentColor = "#60a5fa",
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const padding = getSafePadding({ width, height, ratio: 0.08 });
  const lines = code.trim().split("\n");

  return (
    <div
      style={{
        width,
        height,
        padding,
        background: backgroundColor,
        color: "white",
        fontFamily: "system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        gap: 28,
        justifyContent: "center",
      }}
    >
      <h2
        style={{
          margin: 0,
          fontSize: Math.round(width * 0.045),
          lineHeight: 1,
        }}
      >
        {title}
      </h2>
      <pre
        style={{
          margin: 0,
          borderRadius: 24,
          padding: 30,
          background: "rgba(15,23,42,0.9)",
          border: "1px solid rgba(148,163,184,0.2)",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: Math.round(width * 0.026),
          lineHeight: 1.5,
          overflow: "hidden",
        }}
      >
        {lines.map((line, index) => {
          const visible = interpolate(
            frame,
            [index * 4, index * 4 + 8],
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
                color: highlighted ? accentColor : "#e2e8f0",
                background: highlighted ? `${accentColor}18` : "transparent",
                padding: "0 8px",
                borderRadius: 8,
              }}
            >
              <span style={{ color: "#64748b", marginRight: 18 }}>
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
