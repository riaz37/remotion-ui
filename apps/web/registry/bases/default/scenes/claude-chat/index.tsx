import { loadFont } from "@remotion/google-fonts/Inter";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import {
  BlockCaret,
  fadeUp,
  introBounce,
  morphProgress,
  stageScale,
  useTypedPrompt,
} from "@/remotion/lib/ai-composer-utils";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600"],
  subsets: ["latin"],
});

export type ClaudeChatProps = {
  placeholder?: string;
  prompt?: string;
  modelName?: string;
  modelTier?: string;
  accentColor?: string;
  theme?: "light" | "dark";
};

const THEMES = {
  light: {
    page: "#F5F4EF",
    card: "#FFFFFF",
    border: "#E8E5DD",
    fg: "#1F1E1D",
    muted: "#73726C",
    placeholder: "#A3A097",
    iconBorder: "#E0DDD4",
  },
  dark: {
    page: "#080810",
    card: "#12141c",
    border: "rgba(148,163,184,0.16)",
    fg: "#f4f4f5",
    muted: "#94a3b8",
    placeholder: "#64748b",
    iconBorder: "rgba(148,163,184,0.2)",
  },
} as const;

export const ClaudeChat: React.FC<ClaudeChatProps> = ({
  placeholder = "Draft a launch tweet · summarize a doc",
  prompt = "Draft a launch tweet for our new release",
  modelName = "Opus",
  modelTier = "Max",
  accentColor = "#D97757",
  theme = "dark",
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = THEMES[theme];
  const scale = stageScale(width, height);
  const tw = useTypedPrompt({ prompt });
  const morph = morphProgress(frame, fps);
  const intro = introBounce(frame, fps);
  const cardFade = fadeUp(frame, [6, 22]);

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
            left: 210,
            top: 280,
            width: 860,
            borderRadius: 24,
            background: t.card,
            border: `1px solid ${t.border}`,
            boxShadow: "0 8px 30px -12px rgba(0,0,0,0.35)",
            opacity: cardFade.opacity,
            transform: `translateY(${cardFade.translateY + intro.translateY}px) scale(${intro.scale})`,
            transformOrigin: "center top",
          }}
        >
          <div style={{ padding: "26px 28px", minHeight: 58, fontSize: 21, color: t.fg }}>
            {tw.count > 0 ? (
              <span>
                {tw.text}
                <BlockCaret color={t.fg} blink={!tw.typing} />
              </span>
            ) : (
              <span style={{ color: t.placeholder }}>
                <BlockCaret color={t.fg} blink />
                {placeholder}
              </span>
            )}
          </div>
          <div
            style={{
              padding: "14px 18px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ color: t.muted, fontSize: 18 }}>
              {modelName} <span style={{ opacity: 0.7 }}>{modelTier}</span>
            </span>
            <div style={{ position: "relative", width: 40, height: 40 }}>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  border: `1px solid ${t.iconBorder}`,
                  opacity: 1 - morph,
                  display: "grid",
                  placeItems: "center",
                  color: t.muted,
                  fontSize: 12,
                }}
              >
                ◉
              </div>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 10,
                  background: accentColor,
                  opacity: morph,
                  transform: `scale(${0.85 + morph * 0.15})`,
                  display: "grid",
                  placeItems: "center",
                  color: "#fff",
                  fontWeight: 700,
                }}
              >
                ↑
              </div>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
