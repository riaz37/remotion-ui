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
  weights: ["400", "600", "700"],
  subsets: ["latin"],
});

export type ChatGptProps = {
  greeting?: string;
  placeholder?: string;
  prompt?: string;
  accentColor?: string;
  theme?: "light" | "dark";
};

const CHIPS = ["Create an image", "Write or edit", "Look something up"];

const THEMES = {
  light: {
    page: "#FFFFFF",
    input: "#FFFFFF",
    border: "#E3E3E3",
    fg: "#0D0D0D",
    muted: "#9B9B9B",
    chip: "#5D5D5D",
    sendBg: "#0D0D0D",
  },
  dark: {
    page: "#080810",
    input: "#1a1f2e",
    border: "rgba(148,163,184,0.16)",
    fg: "#f4f4f5",
    muted: "#94a3b8",
    chip: "#cbd5e1",
    sendBg: "#f4f4f5",
  },
} as const;

export const ChatGpt: React.FC<ChatGptProps> = ({
  greeting = "What's on your mind today?",
  placeholder = "Ask anything",
  prompt = "Make a sunset over a calm ocean",
  accentColor = "#2F6FED",
  theme = "dark",
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = THEMES[theme];
  const scale = stageScale(width, height);
  const tw = useTypedPrompt({ prompt });
  const morph = morphProgress(frame, fps);
  const intro = introBounce(frame, fps);
  const heading = fadeUp(frame, [4, 20]);
  const pill = fadeUp(frame, [10, 26]);
  const chips = fadeUp(frame, [16, 32]);

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
            top: 196,
            width: "100%",
            textAlign: "center",
            fontSize: 40,
            fontWeight: 700,
            color: t.fg,
            opacity: heading.opacity,
            transform: `translateY(${heading.translateY}px)`,
          }}
        >
          {greeting}
        </div>
        <div
          style={{
            position: "absolute",
            left: 230,
            top: 300,
            width: 820,
            height: 64,
            borderRadius: 32,
            background: t.input,
            border: `1px solid ${t.border}`,
            display: "flex",
            alignItems: "center",
            padding: "0 12px 0 20px",
            opacity: pill.opacity,
            transform: `translateY(${pill.translateY + intro.translateY * 0.5}px)`,
          }}
        >
          <span style={{ flex: 1, fontSize: 19, color: tw.count > 0 ? t.fg : t.muted }}>
            {tw.count > 0 ? (
              <>
                {tw.text}
                <BlockCaret color={t.fg} blink={!tw.typing} height={20} />
              </>
            ) : (
              placeholder
            )}
          </span>
          <div style={{ position: "relative", width: 44, height: 44 }}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                background: accentColor,
                opacity: 1 - morph,
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                background: t.sendBg,
                opacity: morph,
                color: theme === "dark" ? "#080810" : "#fff",
                display: "grid",
                placeItems: "center",
                fontWeight: 700,
              }}
            >
              ↑
            </div>
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            top: 388,
            width: "100%",
            display: "flex",
            justifyContent: "center",
            gap: 12,
            opacity: chips.opacity * (1 - morph),
            transform: `translateY(${chips.translateY}px)`,
          }}
        >
          {CHIPS.map((chip) => (
            <span
              key={chip}
              style={{
                padding: "10px 16px",
                borderRadius: 20,
                border: `1px solid ${t.border}`,
                color: t.chip,
                fontSize: 15,
              }}
            >
              {chip}
            </span>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
