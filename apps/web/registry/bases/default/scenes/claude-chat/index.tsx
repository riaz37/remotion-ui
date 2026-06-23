import { loadFont } from "@remotion/google-fonts/Inter";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import {
  BlockCaret,
  fadeUp,
  introBounce,
  morphProgress,
  stageScale,
  useTypedPrompt,
} from "@/remotion/lib/ai-composer-utils";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export type ClaudeChatProps = {
  placeholder?: string;
  prompt?: string;
  response?: string;
  artifactTitle?: string;
  projectName?: string;
  modelName?: string;
  modelTier?: string;
  accentColor?: string;
  theme?: "light" | "dark";
};

const THEMES = {
  light: {
    surround: "#817bf2",
    app: "#f7f4eb",
    panel: "#ffffff",
    softPanel: "#efebe1",
    code: "#242737",
    border: "#ddd7cb",
    fg: "#26231d",
    muted: "#746f66",
    faint: "#a29b8e",
    user: "#ece7dc",
    composer: "#ffffff",
  },
  dark: {
    surround: "#080810",
    app: "#15151a",
    panel: "#1f2028",
    softPanel: "#25232c",
    code: "#11131d",
    border: "rgba(255,255,255,0.1)",
    fg: "#f4f4f5",
    muted: "#a1a1aa",
    faint: "#71717a",
    user: "#2b2832",
    composer: "#20212a",
  },
} as const;

const CODE_LINES = [
  "import React from 'react';",
  "import { ScatterChart, Scatter, XAxis, YAxis,",
  "  CartesianGrid, Tooltip } from 'recharts';",
  "",
  "const data = [",
  "  { pageLoadTime: 1.5, sessionDuration: 12 },",
  "  { pageLoadTime: 2.3, sessionDuration: 8 },",
  "  { pageLoadTime: 0.9, sessionDuration: 18 },",
  "  { pageLoadTime: 3.1, sessionDuration: 6 },",
  "  { pageLoadTime: 1.8, sessionDuration: 14 },",
  "  { pageLoadTime: 2.7, sessionDuration: 9 },",
  "];",
  "",
  "export default function UserEngagementScatterPlot() {",
  "  return (",
  "    <ResponsiveContainer width=\"100%\" height={400}>",
  "      <ScatterChart margin={{ top: 20, right: 20 }} />",
  "    </ResponsiveContainer>",
  "  );",
  "}",
];

const ChatSpark: React.FC<{ color: string; size?: number }> = ({
  color,
  size = 24,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <path
      d="M12 2.5 13.8 9l6.7 3-6.7 3L12 21.5 10.2 15l-6.7-3 6.7-3L12 2.5z"
      fill={color}
    />
  </svg>
);

const FileTile: React.FC<{ border: string }> = ({ border }) => (
  <div
    style={{
      width: 60,
      height: 72,
      borderRadius: 8,
      background: "#ffffff",
      border: `1px solid ${border}`,
      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
      display: "grid",
      placeItems: "center",
      color: "#2f80ed",
      fontSize: 12,
      fontWeight: 750,
    }}
  >
    TXT
  </div>
);

const ArtifactCard: React.FC<{
  title: string;
  border: string;
  muted: string;
  accentColor: string;
}> = ({ title, border, muted, accentColor }) => (
  <div
    style={{
      marginTop: 14,
      width: 300,
      padding: 10,
      borderRadius: 9,
      border: `1px solid ${border}`,
      background: "#faf9f5",
      display: "grid",
      gridTemplateColumns: "34px 1fr",
      gap: 10,
      alignItems: "center",
    }}
  >
    <div
      style={{
        width: 30,
        height: 30,
        borderRadius: 7,
        display: "grid",
        placeItems: "center",
        color: accentColor,
        border: `1px solid ${accentColor}40`,
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      {"</>"}
    </div>
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.2 }}>{title}</div>
      <div style={{ marginTop: 3, color: muted, fontSize: 11 }}>Open component</div>
    </div>
  </div>
);

export const ClaudeChat: React.FC<ClaudeChatProps> = ({
  placeholder = "Reply to Claude...",
  prompt = "Build a scatter plot to visualize the relationship between page load time and user session duration.",
  response = "Here's a React component that creates a scatter plot to visualize the relationship between page load time and user session duration:",
  artifactTitle = "Scatter Plot for User Engagement Metrics",
  projectName = "Scatter Plot for User Engagement Metrics",
  modelName = "Claude 3.5 Sonnet",
  modelTier = "",
  accentColor = "#d97757",
  theme = "light",
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = THEMES[theme];
  const scale = stageScale(width, height);
  const typedPrompt = useTypedPrompt({ prompt, startFrame: 22, cps: 72 });
  const typedResponse = useTypedPrompt({ prompt: response, startFrame: 58, cps: 42 });
  const promptSubmitted = interpolate(frame, [50, 58], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const artifact = morphProgress(frame, fps, 78);
  const shell = fadeUp(frame, [0, 14]);
  const intro = introBounce(frame, fps);
  const responseEnter = fadeUp(frame, [52, 68]);
  const codeProgress = interpolate(frame, [82, 118], [0, CODE_LINES.length], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const composerOpacity = interpolate(frame, [24, 62], [1, 0.35], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const showComposerPrompt = promptSubmitted < 0.98 && typedPrompt.count > 0;

  return (
    <AbsoluteFill style={{ background: t.surround, fontFamily }}>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 1280,
          height: 720,
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 64,
            top: 28,
            width: 1152,
            height: 664,
            borderRadius: 22,
            overflow: "hidden",
            background: t.app,
            border: `1px solid ${theme === "light" ? "rgba(255,255,255,0.58)" : t.border}`,
            boxShadow: "0 34px 92px rgba(43,34,92,0.32)",
            opacity: shell.opacity,
            transform: `translateY(${shell.translateY + intro.translateY * 0.25}px) scale(${intro.scale})`,
          }}
        >
          <div
            style={{
              height: 48,
              padding: "0 14px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              color: t.fg,
              fontSize: 13,
              borderBottom: `1px solid ${t.border}`,
            }}
          >
            <strong style={{ fontWeight: 650 }}>Claude</strong>
            <span style={{ color: t.muted }}>♙</span>
            <span style={{ color: t.muted }}>Project Operations</span>
            <span style={{ color: t.faint }}>/</span>
            <span>{projectName}</span>
            <div
              style={{
                marginLeft: "auto",
                display: "flex",
                alignItems: "center",
                gap: 13,
                color: t.muted,
              }}
            >
              <span>☆</span>
              <span
                style={{
                  padding: "7px 12px",
                  borderRadius: 8,
                  background: t.panel,
                  border: `1px solid ${t.border}`,
                  color: t.fg,
                  fontWeight: 650,
                }}
              >
                Share
              </span>
              <span
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: t.softPanel,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                ⚙
              </span>
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 82,
              top: 92,
              width: 426,
              height: 520,
            }}
          >
            <FileTile border={t.border} />

            <div
              style={{
                position: "absolute",
                left: 70,
                top: 84,
                width: 342,
                padding: "10px 14px",
                borderRadius: 10,
                background: t.user,
                color: t.fg,
                fontSize: 14,
                lineHeight: 1.42,
                opacity: promptSubmitted,
                transform: `translateY(${(1 - promptSubmitted) * 10}px)`,
              }}
            >
              <span
                style={{
                  display: "inline-grid",
                  placeItems: "center",
                  width: 21,
                  height: 21,
                  marginRight: 8,
                  borderRadius: "50%",
                  background: "#6b655c",
                  color: "white",
                  fontSize: 9,
                  fontWeight: 700,
                  verticalAlign: "middle",
                }}
              >
                SM
              </span>
              {prompt}
            </div>

            <div
              style={{
                position: "absolute",
                left: 70,
                top: 184,
                width: 360,
                padding: "13px 14px",
                borderRadius: 10,
                background: t.panel,
                border: `1px solid ${t.border}`,
                color: t.fg,
                fontSize: 13,
                lineHeight: 1.42,
                opacity: responseEnter.opacity,
                transform: `translateY(${responseEnter.translateY}px)`,
              }}
            >
              {typedResponse.text}
              {typedResponse.typing ? <BlockCaret color={t.fg} blink={false} height={15} /> : null}
              <ArtifactCard
                title={artifactTitle}
                border={t.border}
                muted={t.muted}
                accentColor={accentColor}
              />
              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 8,
                  color: t.muted,
                  fontSize: 10,
                }}
              >
                <span>Copy</span>
                <span>Retry</span>
                <span>👍</span>
                <span>👎</span>
              </div>
            </div>

            <ChatSpark color={accentColor} size={22} />
            <div
              style={{
                position: "absolute",
                left: 170,
                top: 392,
                color: t.faint,
                fontSize: 9,
              }}
            >
              Claude can make mistakes. Please double-check responses.
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 58,
              bottom: 28,
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: "#36312b",
              display: "grid",
              placeItems: "center",
              color: "#f7ede2",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            R
          </div>
          <div
            style={{
              position: "absolute",
              left: 126,
              bottom: 24,
              width: 338,
              height: 70,
              borderRadius: 13,
              background: t.composer,
              border: `1px solid ${t.border}`,
              boxShadow: theme === "light" ? "0 10px 30px rgba(60,48,32,0.08)" : "none",
                  opacity: Math.max(0.35, composerOpacity),
                  padding: "11px 14px",
                }}
              >
            <div
              style={{
                color: showComposerPrompt ? t.fg : t.faint,
                fontSize: 13,
                lineHeight: 1.35,
                paddingRight: 42,
              }}
            >
              {showComposerPrompt ? (
                <>
                  {typedPrompt.text}
                  {typedPrompt.typing ? (
                    <BlockCaret color={t.fg} blink={false} height={15} />
                  ) : null}
                </>
              ) : (
                placeholder
              )}
            </div>
            <div
              style={{
                position: "absolute",
                left: 14,
                bottom: 9,
                color: t.muted,
                fontSize: 10,
              }}
            >
              {modelName} {modelTier}
            </div>
            <div
              style={{
                position: "absolute",
                right: 11,
                bottom: 10,
                width: 30,
                height: 30,
                borderRadius: 8,
                background: t.softPanel,
                display: "grid",
                placeItems: "center",
              }}
            >
              🔗
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 560,
              top: 92,
              width: 532,
              height: 512,
              opacity: artifact,
              transform: `translateX(${(1 - artifact) * 24}px)`,
              borderRadius: 10,
              overflow: "hidden",
              background: t.panel,
              border: `1px solid ${t.border}`,
              display: "grid",
              gridTemplateRows: "42px 1fr 34px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                padding: "0 13px",
                color: t.fg,
                fontSize: 12,
                borderBottom: `1px solid ${t.border}`,
              }}
            >
              <span style={{ color: t.muted }}>←</span>
              <span style={{ fontWeight: 600 }}>{artifactTitle}</span>
              <div style={{ marginLeft: "auto", display: "flex", gap: 5 }}>
                <span style={{ padding: "4px 8px", borderRadius: 999, color: t.muted }}>
                  Preview
                </span>
                <span
                  style={{
                    padding: "4px 8px",
                    borderRadius: 999,
                    background: t.softPanel,
                    fontWeight: 700,
                  }}
                >
                  Code
                </span>
                <span style={{ color: t.muted }}>×</span>
              </div>
            </div>
            <div
              style={{
                background: t.code,
                color: "#d7dcff",
                fontFamily:
                  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                fontSize: 12,
                lineHeight: 1.5,
                padding: "18px 14px",
                overflow: "hidden",
              }}
            >
              {CODE_LINES.map((line, index) => (
                <div
                  key={`${line}-${index}`}
                  style={{
                    opacity: codeProgress > index ? 1 : 0.12,
                    color:
                      line.startsWith("import") || line.startsWith("export")
                        ? "#c4b5fd"
                        : line.includes("pageLoadTime") || line.includes("sessionDuration")
                          ? "#f6bd72"
                          : "#d7dcff",
                    whiteSpace: "pre",
                  }}
                >
                  {line || " "}
                </div>
              ))}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "0 13px",
                color: t.muted,
                fontSize: 10,
              }}
            >
              Last edited 2 seconds ago
              <span style={{ marginLeft: "auto" }}>Copy</span>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
