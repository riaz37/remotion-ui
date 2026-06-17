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

export type OpencodeProps = {
  placeholder?: string;
  query?: string;
  agentName?: string;
  modelName?: string;
  provider?: string;
  accentColor?: string;
  theme?: "light" | "dark";
};

const THEMES = {
  light: {
    page: "#FFFFFF",
    box: "#F2F2F2",
    fg: "#111111",
    muted: "#888888",
    logoOpen: "#999999",
    logoCode: "#111111",
  },
  dark: {
    page: "#000000",
    box: "#161616",
    fg: "#EDEDED",
    muted: "#6B6B6B",
    logoOpen: "#6B6B6B",
    logoCode: "#EDEDED",
  },
} as const;

export const Opencode: React.FC<OpencodeProps> = ({
  placeholder = "Ask anything... ",
  query = '"What is the tech stack of this project?"',
  agentName = "Build",
  modelName = "Kimi K2.5",
  provider = "Moonshot AI",
  accentColor = "#2B7FFF",
  theme = "dark",
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = THEMES[theme];
  const scale = stageScale(width, height);
  const tw = useTypedPrompt({ prompt: query, startFrame: AI_TYPING_START + 6, cps: 20 });
  const intro = introBounce(frame, fps);
  const logoFade = fadeUp(frame, [4, 22]);
  const boxFade = fadeUp(frame, [12, 30]);
  const hintsFade = fadeUp(frame, [20, 38]);

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
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            letterSpacing: "-0.04em",
            opacity: logoFade.opacity,
            transform: `translateY(${logoFade.translateY}px)`,
          }}
        >
          <span style={{ color: t.logoOpen }}>Open</span>
          <span style={{ color: t.logoCode }}>Code</span>
        </div>
        <div
          style={{
            width: 1000,
            marginTop: 40,
            minHeight: 150,
            background: t.box,
            borderLeft: `4px solid ${accentColor}`,
            padding: "26px 28px",
            opacity: boxFade.opacity,
            transform: `translateY(${boxFade.translateY}px) scale(${intro.scale})`,
            color: t.fg,
            fontSize: 22,
          }}
        >
          <div>
            <span style={{ color: t.muted }}>{placeholder}</span>
            {tw.count > 0 ? <span>{tw.text}</span> : null}
            <BlockCaret color={t.fg} blink={!tw.typing} height={24} />
          </div>
          <div style={{ marginTop: 26, fontSize: 20, color: t.muted, display: "flex", gap: 16 }}>
            <span style={{ color: accentColor }}>{agentName}</span>
            <span>{modelName}</span>
            <span>{provider}</span>
          </div>
        </div>
        <div
          style={{
            width: 1000,
            marginTop: 18,
            display: "flex",
            justifyContent: "flex-end",
            gap: 22,
            fontSize: 18,
            color: t.muted,
            opacity: hintsFade.opacity,
          }}
        >
          <span>tab agents</span>
          <span>ctrl+p commands</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
