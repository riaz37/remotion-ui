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
  weights: ["400", "500", "700"],
  subsets: ["latin"],
});

export type V0ComposerProps = {
  greeting?: string;
  placeholder?: string;
  prompt?: string;
  modelName?: string;
  projectName?: string;
  theme?: "light" | "dark";
};

const THEMES = {
  light: {
    page: "#FFFFFF",
    box: "#FFFFFF",
    border: "#E3E3E3",
    fg: "#0D0D0D",
    muted: "#8A8A8A",
    btn: "#0D0D0D",
    btnFg: "#FFFFFF",
  },
  dark: {
    page: "#000000",
    box: "#0A0A0A",
    border: "#2A2A2A",
    fg: "#EDEDED",
    muted: "#8A8A8A",
    btn: "#FFFFFF",
    btnFg: "#0A0A0A",
  },
} as const;

export const V0Composer: React.FC<V0ComposerProps> = ({
  greeting = "What do you want to create?",
  placeholder = "Ask v0 to build…",
  prompt = "a landing page for my SaaS with pricing and testimonials",
  modelName = "v0 Max",
  projectName = "Project",
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
  const box = fadeUp(frame, [10, 26]);

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
            top: 150,
            width: "100%",
            textAlign: "center",
            fontSize: 44,
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
            left: 200,
            top: 270,
            width: 880,
            height: 150,
            borderRadius: 16,
            background: t.box,
            border: `1px solid ${t.border}`,
            opacity: box.opacity,
            transform: `translateY(${box.translateY}px) scale(${intro.scale})`,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ flex: 1, padding: "18px 20px", fontSize: 18, color: t.fg }}>
            {tw.count > 0 ? (
              <>
                {tw.text}
                <BlockCaret color={t.fg} blink={!tw.typing} height={20} />
              </>
            ) : (
              <span style={{ color: t.muted }}>{placeholder}</span>
            )}
          </div>
          <div
            style={{
              padding: "12px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 15, color: t.fg }}>{modelName}</span>
            <span style={{ fontSize: 15, color: t.muted }}>{projectName}</span>
            <div
              style={{
                position: "relative",
                width: 40,
                height: 40,
                borderRadius: 10,
                background: t.btn,
                color: t.btnFg,
              }}
            >
              <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", opacity: 1 - morph }}>🎤</div>
              <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", opacity: morph, fontWeight: 700 }}>↑</div>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
