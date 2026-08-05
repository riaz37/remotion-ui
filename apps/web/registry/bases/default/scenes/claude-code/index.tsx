import { loadFont } from "@remotion/google-fonts/JetBrainsMono";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import {
  AI_TYPING_START_TUI,
  Caret,
  fadeUpAt,
  introBounceIn,
  stageScale,
  useTypewriter,
} from "@/remotion/lib/ai-composer-utils";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "700"],
  subsets: ["latin"],
});

export type ClaudeCodeProps = {
  title?: string;
  userName?: string;
  model?: string;
  cwd?: string;
  placeholder?: string;
  prompt?: string;
  accentColor?: string;
  theme?: "light" | "dark";
  speed?: number;
};

type Theme = {
  page: string;
  windowBar: string;
  windowBody: string;
  fg: string;
  fgMuted: string;
  fgDim: string;
};

export const THEMES: Record<"light" | "dark", Theme> = {
  light: {
    page: "#E8E5DD",
    windowBar: "#D8D3CA",
    windowBody: "#FBFAF7",
    fg: "#1F1E1D",
    fgMuted: "#73726C",
    fgDim: "#A3A097",
  },
  dark: {
    page: "#2B2A28",
    windowBar: "#3A3633",
    windowBody: "#1B1A18",
    fg: "#E8E5DD",
    fgMuted: "#8A857C",
    fgDim: "#6B6660",
  },
};

const TYPING_CPS = 18;

const WHATS_NEW = [
  "/agents to create subagents",
  "/security-review for review agent",
  "ctrl+b to background bashes",
];

const TRAFFIC_LIGHTS = ["#FF5F57", "#FEBC2E", "#28C840"];

function Mascot({ accent, size = 96 }: { accent: string; size?: number }) {
  return (
    <svg height={size} width={size} viewBox="0 0 24 24">
      <title>Claude Code</title>
      <path
        clipRule="evenodd"
        d="M20.998 10.949H24v3.102h-3v3.028h-1.487V20H18v-2.921h-1.487V20H15v-2.921H9V20H7.488v-2.921H6V20H4.487v-2.921H3V14.05H0V10.95h3V5h17.998v5.949zM6 10.949h1.488V8.102H6v2.847zm10.51 0H18V8.102h-1.49v2.847z"
        fill={accent}
        fillRule="evenodd"
      />
    </svg>
  );
}

export const ClaudeCode: React.FC<ClaudeCodeProps> = ({
  title = "Claude Code v2.0.0",
  userName = "Meaghan",
  model = "Opus 4.8 • Max 20x",
  cwd = "/users/meaghan/code/apps",
  placeholder = 'Try "edit <filepath> to ..."',
  prompt = "edit src/theme.ts to add a dark mode toggle",
  accentColor = "#D97757",
  theme = "dark",
  speed = 1,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = THEMES[theme];
  const scale = stageScale(width, height);

  const tw = useTypewriter(prompt, {
    cps: TYPING_CPS,
    speed,
    startFrame: AI_TYPING_START_TUI,
  });
  const showText = tw.count > 0;

  const intro = introBounceIn(frame * speed, fps);
  const leftFade = fadeUpAt(frame * speed, [6, 22]);
  const rightFade = fadeUpAt(frame * speed, [12, 30]);
  const promptFade = fadeUpAt(frame * speed, [18, 36]);

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
            background: t.windowBody,
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 24px 60px -20px rgba(0,0,0,0.6)",
            opacity: intro.scale,
            transform: `translateY(${intro.translateY}px) scale(${intro.scale})`,
            transformOrigin: "center top",
            display: "flex",
            flexDirection: "column",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              height: 40,
              background: t.windowBar,
              display: "flex",
              alignItems: "center",
              gap: 8,
              paddingLeft: 16,
              flexShrink: 0,
            }}
          >
            {TRAFFIC_LIGHTS.map((color) => (
              <div
                key={color}
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: color,
                }}
              />
            ))}
          </div>

          <div
            style={{
              flex: 1,
              position: "relative",
              padding: 28,
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                position: "relative",
                border: `1px dashed ${accentColor}`,
                borderRadius: 6,
                padding: "28px 24px 24px",
                opacity: leftFade.opacity,
                transform: `translateY(${leftFade.translateY}px)`,
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: -11,
                  left: 22,
                  padding: "0 10px",
                  background: t.windowBody,
                  color: accentColor,
                  fontSize: 16,
                  fontWeight: 700,
                }}
              >
                {title}
              </span>

              <div style={{ display: "flex", flexDirection: "row" }}>
                <div
                  style={{
                    width: "42%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: 16,
                    paddingRight: 24,
                    boxSizing: "border-box",
                  }}
                >
                  <div style={{ fontSize: 20, color: t.fg }}>
                    Welcome back {userName}!
                  </div>
                  <div style={{ alignSelf: "center" }}>
                    <Mascot accent={accentColor} />
                  </div>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 4 }}
                  >
                    <div style={{ fontSize: 15, color: t.fgMuted }}>{model}</div>
                    <div style={{ fontSize: 15, color: t.fgMuted }}>{cwd}</div>
                  </div>
                </div>

                <div
                  style={{
                    width: "58%",
                    borderLeft: `1px dashed ${accentColor}`,
                    paddingLeft: 24,
                    boxSizing: "border-box",
                    display: "flex",
                    flexDirection: "column",
                    opacity: rightFade.opacity,
                    transform: `translateY(${rightFade.translateY}px)`,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: accentColor,
                        marginBottom: 10,
                      }}
                    >
                      What&apos;s new
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      {WHATS_NEW.map((line) => (
                        <div key={line} style={{ fontSize: 14, color: t.fg }}>
                          {line}
                        </div>
                      ))}
                      <div style={{ fontSize: 14, color: t.fgDim }}>
                        ... /help for more
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ height: 32 }} />

            <div
              style={{
                opacity: promptFade.opacity,
                transform: `translateY(${promptFade.translateY}px)`,
              }}
            >
              <div
                style={{
                  height: 1,
                  background: t.fgDim,
                  opacity: 0.4,
                  marginBottom: 16,
                }}
              />
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  fontSize: 17,
                  whiteSpace: "pre",
                }}
              >
                <span style={{ color: t.fgMuted }}>{"> "}</span>
                {showText ? (
                  <span
                    style={{
                      position: "relative",
                      color: t.fg,
                      display: "inline-flex",
                      alignItems: "center",
                    }}
                  >
                    {tw.text}
                    <span style={{ opacity: 0.55, display: "inline-flex" }}>
                      <Caret
                        width={11}
                        height={22}
                        color={t.fg}
                        blink={!tw.typing}
                        speed={speed}
                        marginLeft={2}
                      />
                    </span>
                  </span>
                ) : (
                  <span
                    style={{
                      position: "relative",
                      color: t.fgMuted,
                      display: "inline-flex",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ opacity: 0.55, display: "inline-flex" }}>
                      <Caret
                        width={11}
                        height={22}
                        color={t.fg}
                        blink={!tw.typing}
                        speed={speed}
                      />
                    </span>
                    <span style={{ marginLeft: 6 }}>{placeholder}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
