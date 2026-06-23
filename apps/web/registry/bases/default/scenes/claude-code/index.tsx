import { loadFont } from "@remotion/google-fonts/JetBrainsMono";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import {
  AI_TYPING_START,
  BlockCaret,
  fadeUp,
  introBounce,
  stageScale,
  useTypedPrompt,
} from "@/remotion/lib/ai-composer-utils";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "700"],
  subsets: ["latin"],
});

const WHATS_NEW = [
  "/agents to create subagents",
  "/security-review for review agent",
  "ctrl+b to background bashes",
];

export type ClaudeCodeProps = {
  title?: string;
  userName?: string;
  model?: string;
  cwd?: string;
  placeholder?: string;
  prompt?: string;
  accentColor?: string;
  theme?: "light" | "dark";
};

const THEMES = {
  light: {
    page: "#E8E5DD",
    bar: "#D8D3CA",
    body: "#FBFAF7",
    fg: "#1F1E1D",
    muted: "#73726C",
    dim: "#A3A097",
  },
  dark: {
    page: "#080810",
    bar: "#1a1f2e",
    body: "#0c1018",
    fg: "#e2e8f0",
    muted: "#94a3b8",
    dim: "#64748b",
  },
} as const;

export const ClaudeCode: React.FC<ClaudeCodeProps> = ({
  title = "Claude Code v2.0.0",
  userName = "Riaz",
  model = "Opus · Max",
  cwd = "~/code/remotionui",
  placeholder = 'Try "edit src/..."',
  prompt = "edit src/theme.ts to add a dark mode toggle",
  accentColor = "#D97757",
  theme = "dark",
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = THEMES[theme];
  const scale = stageScale(width, height);
  const tw = useTypedPrompt({ prompt, startFrame: AI_TYPING_START + 6, cps: 18 });
  const intro = introBounce(frame, fps);
  const leftFade = fadeUp(frame, [6, 22]);
  const rightFade = fadeUp(frame, [12, 30]);
  const promptFade = fadeUp(frame, [18, 36]);

  return (
    <AbsoluteFill style={{ background: t.page, fontFamily }}>
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
            left: 90,
            top: 40,
            width: 1100,
            height: 620,
            borderRadius: 12,
            overflow: "hidden",
            background: t.body,
            boxShadow: "0 24px 60px -20px rgba(0,0,0,0.55)",
            transform: `translateY(${intro.translateY}px) scale(${intro.scale})`,
            transformOrigin: "center top",
          }}
        >
          <div style={{ height: 40, background: t.bar, display: "flex", alignItems: "center", gap: 8, paddingLeft: 16 }}>
            {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
              <div key={c} style={{ width: 12, height: 12, borderRadius: "50%", background: c }} />
            ))}
          </div>
          <div style={{ padding: 28, display: "flex", flexDirection: "column", height: "calc(100% - 40px)" }}>
            <div
              style={{
                border: `1px dashed ${accentColor}`,
                borderRadius: 6,
                padding: "24px",
                flex: 1,
                display: "flex",
                opacity: leftFade.opacity,
              }}
            >
              <div style={{ width: "42%", color: t.fg, fontSize: 16 }}>
                <div style={{ marginBottom: 16 }}>Welcome back {userName}!</div>
                <div style={{ color: t.muted, fontSize: 14 }}>{model}</div>
                <div style={{ color: t.muted, fontSize: 14 }}>{cwd}</div>
              </div>
              <div
                style={{
                  width: "58%",
                  borderLeft: `1px dashed ${accentColor}`,
                  paddingLeft: 24,
                  opacity: rightFade.opacity,
                }}
              >
                <div style={{ color: accentColor, fontWeight: 700, marginBottom: 10 }}>What&apos;s new</div>
                {WHATS_NEW.map((line) => (
                  <div key={line} style={{ fontSize: 14, marginBottom: 6, color: t.dim }}>
                    {line}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 20, opacity: promptFade.opacity, fontSize: 17, color: t.fg }}>
              {"> "}
              {tw.count > 0 ? (
                <>
                  {tw.text}
                  <BlockCaret color={t.fg} blink={!tw.typing} height={20} />
                </>
              ) : (
                <span style={{ color: t.muted }}>
                  <BlockCaret color={t.fg} blink />
                  {placeholder}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
