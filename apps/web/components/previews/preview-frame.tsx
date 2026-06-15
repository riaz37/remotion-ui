import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill } from "remotion";
import { BRAND_STAGE } from "@/lib/brand-tokens";

type PreviewLane =
  | "atoms"
  | "signals"
  | "vectors"
  | "spatial"
  | "cuts"
  | "blocks"
  | "reels";

const STAGE = BRAND_STAGE;

export const previewTextStyle: CSSProperties = {
  color: "#ececec",
  fontSize: 52,
  fontFamily: "system-ui, sans-serif",
  textAlign: "center",
  lineHeight: 1,
  fontWeight: 600,
  letterSpacing: 0,
};

/** Full-frame scene root — neutral studio stage. */
export const PreviewFrame: React.FC<{
  children: ReactNode;
  lane?: PreviewLane;
  backgroundColor?: string;
  justifyContent?: CSSProperties["justifyContent"];
  alignItems?: CSSProperties["alignItems"];
  padding?: number;
}> = ({
  children,
  backgroundColor,
  justifyContent = "center",
  alignItems = "center",
  padding = 72,
}) => (
  <AbsoluteFill
    style={{
      background: backgroundColor ?? STAGE,
      justifyContent,
      alignItems,
      padding,
      color: "#ececec",
      fontFamily: "system-ui, sans-serif",
      overflow: "hidden",
    }}
  >
    {children}
  </AbsoluteFill>
);

export const PreviewLabel: React.FC<{ children: ReactNode; tone?: string }> = ({
  children,
  tone = "#ececec",
}) => <div style={{ ...previewTextStyle, color: tone }}>{children}</div>;

export function laneAccent(_lane: PreviewLane): string {
  return "#ececec";
}

export const PreviewKicker: React.FC<{
  children: ReactNode;
  lane?: PreviewLane;
}> = ({ children }) => (
  <div
    style={{
      color: "rgba(236,236,236,0.55)",
      fontSize: 24,
      fontWeight: 500,
      letterSpacing: "0.02em",
    }}
  >
    {children}
  </div>
);

export const PreviewHeadline: React.FC<{
  children: ReactNode;
  size?: number;
}> = ({ children, size = 68 }) => (
  <div
    style={{
      maxWidth: 720,
      color: "#ececec",
      fontSize: size,
      lineHeight: 0.94,
      fontWeight: 600,
      letterSpacing: 0,
      textAlign: "center",
    }}
  >
    {children}
  </div>
);

export const ProductCard: React.FC<{
  kicker: string;
  title: string;
  detail?: string;
  lane?: PreviewLane;
}> = ({ kicker, title, detail }) => (
  <div
    style={{
      width: 590,
      minHeight: 258,
      display: "grid",
      alignContent: "center",
      gap: 16,
      borderRadius: 8,
      padding: "40px 48px",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.1)",
      textAlign: "center",
    }}
  >
    <PreviewKicker>{kicker}</PreviewKicker>
    <PreviewHeadline>{title}</PreviewHeadline>
    {detail ? (
      <div
        style={{
          color: "rgba(236,236,236,0.55)",
          fontSize: 28,
          lineHeight: 1.15,
          fontWeight: 500,
        }}
      >
        {detail}
      </div>
    ) : null}
  </div>
);

export const MetricPanel: React.FC<{
  label: string;
  value: ReactNode;
  delta: string;
  lane?: PreviewLane;
}> = ({ label, value, delta }) => (
  <div
    style={{
      width: 520,
      borderRadius: 8,
      padding: "42px 46px",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.1)",
    }}
  >
    <PreviewKicker>{label}</PreviewKicker>
    <div
      style={{
        marginTop: 18,
        fontSize: 92,
        lineHeight: 0.9,
        fontWeight: 600,
        letterSpacing: 0,
      }}
    >
      {value}
    </div>
    <div
      style={{
        marginTop: 20,
        color: "rgba(236,236,236,0.65)",
        fontSize: 34,
        fontWeight: 500,
      }}
    >
      {delta}
    </div>
  </div>
);

export const CodePanel: React.FC<{
  lines: string[];
  lane?: PreviewLane;
}> = ({ lines }) => (
  <div
    style={{
      width: 650,
      borderRadius: 8,
      overflow: "hidden",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.1)",
      fontFamily: "SFMono-Regular, Menlo, Consolas, monospace",
    }}
  >
    <div
      style={{
        height: 48,
        display: "flex",
        alignItems: "center",
        gap: 9,
        padding: "0 20px",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {["#737373", "#737373", "#737373"].map((color, i) => (
        <span
          key={i}
          style={{ width: 12, height: 12, borderRadius: 999, background: color }}
        />
      ))}
    </div>
    <div style={{ padding: "26px 30px", display: "grid", gap: 12 }}>
      {lines.map((line, index) => (
        <div
          key={`${line}-${index}`}
          style={{
            color: index === 1 ? "#e8b86d" : "#e5e7eb",
            fontSize: 25,
            lineHeight: 1.25,
            whiteSpace: "pre",
          }}
        >
          {line}
        </div>
      ))}
    </div>
  </div>
);

export const MediaTile: React.FC<{
  title: string;
  subtitle: string;
  lane?: PreviewLane;
}> = ({ title, subtitle }) => (
  <div
    style={{
      width: 620,
      height: 330,
      display: "grid",
      alignContent: "end",
      gap: 12,
      borderRadius: 8,
      padding: 36,
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.1)",
    }}
  >
    <PreviewKicker>{subtitle}</PreviewKicker>
    <PreviewHeadline size={62}>{title}</PreviewHeadline>
  </div>
);
