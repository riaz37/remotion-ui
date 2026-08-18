import type { CSSProperties, ReactNode } from "react";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { AbsoluteFill } from "remotion";
import { usePreviewStage } from "./preview-stage";

/**
 * Real faces for the whole preview stage.
 *
 * Every preview in the catalog renders inside `PreviewFrame`, and it used to
 * hand them `system-ui, sans-serif` and a system monospace stack. That makes a
 * still a function of the machine that rendered it: metrics, weights and
 * available glyphs all differ between a macOS dev box and a Linux render
 * worker, so line breaks and fitted type move between environments and the
 * audit's PSNR comparisons compare two different typefaces.
 *
 * Loading here rather than inside each preview keeps the dependency on the
 * docs surface — the registry primitives stay font-agnostic on purpose, so
 * copying one file never drags `@remotion/google-fonts` along with it.
 */
const { fontFamily: uiFontFamily } = loadInter("normal", {
  weights: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
});

const { fontFamily: monoFontFamily } = loadMono("normal", {
  weights: ["400", "500", "700"],
  subsets: ["latin"],
});

/** Inter, with the old system stack kept as the fallback leg. */
export const PREVIEW_UI_FONT = `${uiFontFamily}, system-ui, sans-serif`;

/** JetBrains Mono, for terminals and code plates. */
export const PREVIEW_MONO_FONT = `${monoFontFamily}, SFMono-Regular, Menlo, Consolas, monospace`;

type PreviewLane =
  | "atoms"
  | "signals"
  | "vectors"
  | "spatial"
  | "cuts"
  | "blocks"
  | "reels";

export const previewTextStyle: CSSProperties = {
  color: "#ececec",
  fontSize: 52,
  fontFamily: PREVIEW_UI_FONT,
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
}) => {
  const tokens = usePreviewStage();

  return (
    <AbsoluteFill
      style={{
        background: backgroundColor ?? tokens.stage,
        justifyContent,
        alignItems,
        padding,
        color: tokens.ink,
        fontFamily: PREVIEW_UI_FONT,
        overflow: "hidden",
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

export const PreviewLabel: React.FC<{ children: ReactNode; tone?: string }> = ({
  children,
  tone,
}) => {
  const tokens = usePreviewStage();

  return (
    <div style={{ ...previewTextStyle, color: tone ?? tokens.ink }}>
      {children}
    </div>
  );
};

export const PreviewGhostStack: React.FC<{
  children: ReactNode;
  ghost: ReactNode;
  ghostOpacity?: number;
  scale?: number;
}> = ({ children, ghost, ghostOpacity = 0.16, scale }) => (
  <div
    style={{
      display: "grid",
      placeItems: "center",
      ...(scale !== undefined ? { transform: `scale(${scale})` } : {}),
    }}
  >
    <div style={{ gridArea: "1 / 1", opacity: ghostOpacity }}>{ghost}</div>
    <div style={{ gridArea: "1 / 1" }}>{children}</div>
  </div>
);

export function laneAccent(_lane: PreviewLane): string {
  return "#ececec";
}

export const PreviewKicker: React.FC<{
  children: ReactNode;
  lane?: PreviewLane;
}> = ({ children }) => {
  const tokens = usePreviewStage();

  return (
    <div
      style={{
        color: tokens.muted,
        fontSize: 24,
        fontWeight: 500,
        letterSpacing: "0.02em",
      }}
    >
      {children}
    </div>
  );
};

export const PreviewHeadline: React.FC<{
  children: ReactNode;
  size?: number;
}> = ({ children, size = 68 }) => {
  const tokens = usePreviewStage();

  return (
  <div
    style={{
      maxWidth: 720,
      color: tokens.ink,
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
};

export const ProductCard: React.FC<{
  kicker: string;
  title: string;
  detail?: string;
  lane?: PreviewLane;
}> = ({ kicker, title, detail }) => {
  const tokens = usePreviewStage();

  return (
    <div
      style={{
        width: 590,
        minHeight: 258,
        display: "grid",
        alignContent: "center",
        gap: 16,
        borderRadius: 8,
        padding: "40px 48px",
        background: tokens.panelFill,
        border: `1px solid ${tokens.panelBorder}`,
        textAlign: "center",
      }}
    >
      <PreviewKicker>{kicker}</PreviewKicker>
      <PreviewHeadline>{title}</PreviewHeadline>
      {detail ? (
        <div
          style={{
            color: tokens.muted,
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
};

export const MetricPanel: React.FC<{
  label: string;
  value: ReactNode;
  delta: string;
  lane?: PreviewLane;
}> = ({ label, value, delta }) => {
  const tokens = usePreviewStage();

  return (
    <div
      style={{
        width: 520,
        borderRadius: 8,
        padding: "42px 46px",
        background: tokens.panelFill,
        border: `1px solid ${tokens.panelBorder}`,
      }}
    >
      <PreviewKicker>{label}</PreviewKicker>
      <div
        style={{
          marginTop: 18,
          color: tokens.ink,
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
          color: tokens.muted,
          fontSize: 34,
          fontWeight: 500,
        }}
      >
        {delta}
      </div>
    </div>
  );
};

export const CodePanel: React.FC<{
  lines: string[];
  lane?: PreviewLane;
}> = ({ lines }) => {
  const tokens = usePreviewStage();

  return (
    <div
      style={{
        width: 650,
        borderRadius: 8,
        overflow: "hidden",
        background: tokens.panelFill,
        border: `1px solid ${tokens.panelBorder}`,
        fontFamily: PREVIEW_MONO_FONT,
      }}
    >
      <div
        style={{
          height: 48,
          display: "flex",
          alignItems: "center",
          gap: 9,
          padding: "0 20px",
          borderBottom: `1px solid ${tokens.panelBorder}`,
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
              color: index === 1 ? tokens.accent : tokens.ink,
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
};

export const MediaTile: React.FC<{
  title: string;
  subtitle: string;
  lane?: PreviewLane;
}> = ({ title, subtitle }) => {
  const tokens = usePreviewStage();

  return (
    <div
      style={{
        width: 620,
        height: 330,
        display: "grid",
        alignContent: "end",
        gap: 12,
        borderRadius: 8,
        padding: 36,
        background: tokens.panelFill,
        border: `1px solid ${tokens.panelBorder}`,
      }}
    >
      <PreviewKicker>{subtitle}</PreviewKicker>
      <PreviewHeadline size={62}>{title}</PreviewHeadline>
    </div>
  );
};
