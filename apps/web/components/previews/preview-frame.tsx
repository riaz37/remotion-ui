import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill } from "remotion";

type PreviewLane =
  | "atoms"
  | "signals"
  | "vectors"
  | "spatial"
  | "cuts"
  | "blocks"
  | "reels";

const laneStyles: Record<
  PreviewLane,
  { background: string; accent: string; muted: string }
> = {
  atoms: {
    background:
      "radial-gradient(circle at 18% 18%, rgba(129,140,248,0.30), transparent 32%), linear-gradient(135deg, #101322, #050712)",
    accent: "#a5b4fc",
    muted: "#6366f1",
  },
  signals: {
    background:
      "radial-gradient(circle at 76% 18%, rgba(236,72,153,0.26), transparent 34%), linear-gradient(145deg, #18091b, #07111f)",
    accent: "#f9a8d4",
    muted: "#db2777",
  },
  vectors: {
    background:
      "radial-gradient(circle at 72% 28%, rgba(34,211,238,0.22), transparent 34%), linear-gradient(145deg, #06131b, #08111f)",
    accent: "#67e8f9",
    muted: "#0891b2",
  },
  spatial: {
    background:
      "radial-gradient(circle at 68% 24%, rgba(52,211,153,0.22), transparent 34%), linear-gradient(150deg, #062018, #07111f)",
    accent: "#6ee7b7",
    muted: "#059669",
  },
  cuts: {
    background:
      "radial-gradient(circle at 24% 22%, rgba(251,146,60,0.24), transparent 32%), linear-gradient(140deg, #1e1008, #07111f)",
    accent: "#fdba74",
    muted: "#f97316",
  },
  blocks: {
    background:
      "radial-gradient(circle at 76% 20%, rgba(250,204,21,0.20), transparent 34%), linear-gradient(145deg, #191405, #07111f)",
    accent: "#fde68a",
    muted: "#ca8a04",
  },
  reels: {
    background:
      "radial-gradient(circle at 20% 20%, rgba(244,114,182,0.26), transparent 35%), linear-gradient(145deg, #1d0b17, #070812)",
    accent: "#f9a8d4",
    muted: "#db2777",
  },
};

export const previewTextStyle: CSSProperties = {
  color: "white",
  fontSize: 52,
  fontFamily: "system-ui, sans-serif",
  textAlign: "center",
  lineHeight: 1,
  fontWeight: 900,
  letterSpacing: 0,
};

/** Full-frame scene root — primitives wrap only the label, not AbsoluteFill. */
export const PreviewFrame: React.FC<{
  children: ReactNode;
  lane?: PreviewLane;
  backgroundColor?: string;
  justifyContent?: CSSProperties["justifyContent"];
  alignItems?: CSSProperties["alignItems"];
  padding?: number;
}> = ({
  children,
  lane = "atoms",
  backgroundColor,
  justifyContent = "center",
  alignItems = "center",
  padding = 72,
}) => (
  <AbsoluteFill
    style={{
      background: backgroundColor ?? laneStyles[lane].background,
      justifyContent,
      alignItems,
      padding,
      color: "white",
      fontFamily: "system-ui, sans-serif",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.05), transparent 38%, rgba(0,0,0,0.18))",
        pointerEvents: "none",
      }}
    />
    {children}
  </AbsoluteFill>
);

export const PreviewLabel: React.FC<{ children: ReactNode; tone?: string }> = ({
  children,
  tone = "white",
}) => <div style={{ ...previewTextStyle, color: tone }}>{children}</div>;

export function laneAccent(lane: PreviewLane): string {
  return laneStyles[lane].accent;
}

export const PreviewKicker: React.FC<{
  children: ReactNode;
  lane?: PreviewLane;
}> = ({ children, lane = "atoms" }) => (
  <div
    style={{
      color: laneStyles[lane].accent,
      fontSize: 24,
      fontWeight: 900,
      textTransform: "uppercase",
      letterSpacing: "0.14em",
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
      color: "white",
      fontSize: size,
      lineHeight: 0.94,
      fontWeight: 950,
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
}> = ({ kicker, title, detail, lane = "atoms" }) => (
  <div
    style={{
      width: 590,
      minHeight: 258,
      display: "grid",
      alignContent: "center",
      gap: 16,
      borderRadius: 30,
      padding: "40px 48px",
      background: "rgba(255,255,255,0.09)",
      border: "1px solid rgba(255,255,255,0.17)",
      boxShadow: `0 34px 100px ${laneStyles[lane].muted}44`,
      textAlign: "center",
      backdropFilter: "blur(12px)",
    }}
  >
    <PreviewKicker lane={lane}>{kicker}</PreviewKicker>
    <PreviewHeadline>{title}</PreviewHeadline>
    {detail ? (
      <div
        style={{
          color: "rgba(255,255,255,0.68)",
          fontSize: 28,
          lineHeight: 1.15,
          fontWeight: 700,
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
}> = ({ label, value, delta, lane = "signals" }) => (
  <div
    style={{
      width: 520,
      borderRadius: 32,
      padding: "42px 46px",
      background: "rgba(2,6,23,0.62)",
      border: "1px solid rgba(255,255,255,0.16)",
      boxShadow: `0 34px 100px ${laneStyles[lane].muted}38`,
    }}
  >
    <PreviewKicker lane={lane}>{label}</PreviewKicker>
    <div
      style={{
        marginTop: 18,
        fontSize: 92,
        lineHeight: 0.9,
        fontWeight: 950,
        letterSpacing: 0,
      }}
    >
      {value}
    </div>
    <div
      style={{
        marginTop: 20,
        color: laneStyles[lane].accent,
        fontSize: 34,
        fontWeight: 900,
      }}
    >
      {delta}
    </div>
  </div>
);

export const CodePanel: React.FC<{
  lines: string[];
  lane?: PreviewLane;
}> = ({ lines, lane = "blocks" }) => (
  <div
    style={{
      width: 650,
      borderRadius: 28,
      overflow: "hidden",
      background: "rgba(2,6,23,0.74)",
      border: "1px solid rgba(255,255,255,0.16)",
      boxShadow: `0 34px 100px ${laneStyles[lane].muted}30`,
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
        borderBottom: "1px solid rgba(255,255,255,0.12)",
      }}
    >
      {["#fb7185", "#facc15", "#34d399"].map((color) => (
        <span
          key={color}
          style={{ width: 12, height: 12, borderRadius: 999, background: color }}
        />
      ))}
    </div>
    <div style={{ padding: "26px 30px", display: "grid", gap: 12 }}>
      {lines.map((line, index) => (
        <div
          key={`${line}-${index}`}
          style={{
            color: index === 1 ? laneStyles[lane].accent : "#e5e7eb",
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
}> = ({ title, subtitle, lane = "blocks" }) => (
  <div
    style={{
      width: 620,
      height: 330,
      display: "grid",
      alignContent: "end",
      gap: 12,
      borderRadius: 34,
      padding: 36,
      background: `radial-gradient(circle at 72% 20%, ${laneStyles[lane].muted}80, transparent 34%), rgba(255,255,255,0.08)`,
      border: "1px solid rgba(255,255,255,0.16)",
      boxShadow: `0 34px 100px ${laneStyles[lane].muted}36`,
    }}
  >
    <PreviewKicker lane={lane}>{subtitle}</PreviewKicker>
    <PreviewHeadline size={62}>{title}</PreviewHeadline>
  </div>
);
