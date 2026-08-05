import { loadFont } from "@remotion/google-fonts/Inter";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import {
  AI_TYPING_CPS,
  AI_TYPING_START,
  Caret,
  fadeUpAt,
  introBounceIn,
  morphProgressAt,
  stageScale,
  useTypewriter,
} from "@/remotion/lib/ai-composer-utils";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export type V0ComposerProps = {
  greeting?: string;
  placeholder?: string;
  prompt?: string;
  modelName?: string;
  projectName?: string;
  theme?: "light" | "dark";
  speed?: number;
};

type Theme = {
  page: string;
  boxBg: string;
  boxBorder: string;
  fg: string;
  fgMuted: string;
  iconColor: string;
  btnBg: string;
  btnFg: string;
};

export const THEMES: Record<"light" | "dark", Theme> = {
  light: {
    page: "#FFFFFF",
    boxBg: "#FFFFFF",
    boxBorder: "#E3E3E3",
    fg: "#0D0D0D",
    fgMuted: "#8A8A8A",
    iconColor: "#5D5D5D",
    btnBg: "#0D0D0D",
    btnFg: "#FFFFFF",
  },
  dark: {
    page: "#000000",
    boxBg: "#0A0A0A",
    boxBorder: "#2A2A2A",
    fg: "#EDEDED",
    fgMuted: "#8A8A8A",
    iconColor: "#A0A0A0",
    btnBg: "#FFFFFF",
    btnFg: "#0A0A0A",
  },
};

function PlusIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <title>Add</title>
      <path
        d="M12 5v14M5 12h14"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </svg>
  );
}

function V0LogoIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <title>v0</title>
      <rect
        x={2.5}
        y={2.5}
        width={19}
        height={19}
        rx={5}
        stroke={color}
        strokeWidth={1.8}
      />
      <rect
        x={7.5}
        y={7.5}
        width={9}
        height={9}
        rx={2.5}
        stroke={color}
        strokeWidth={1.8}
      />
    </svg>
  );
}

function ChevronDownIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <title>Expand</title>
      <path
        d="M6 9l6 6 6-6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MicIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <title>Voice input</title>
      <rect
        x={9}
        y={3}
        width={6}
        height={11}
        rx={3}
        stroke={color}
        strokeWidth={1.8}
      />
      <path
        d="M5.5 11a6.5 6.5 0 0013 0M12 17.5V21M9 21h6"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowUpIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <title>Send</title>
      <path
        d="M12 19V6M12 6l-6 6M12 6l6 6"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export const V0Composer: React.FC<V0ComposerProps> = ({
  greeting = "What do you want to create?",
  placeholder = "Ask v0 to build…",
  prompt = "a landing page for my SaaS with pricing and testimonials",
  modelName = "v0 Max",
  projectName = "Project",
  theme = "dark",
  speed = 1,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = THEMES[theme];

  const refW = 1280;
  const scale = stageScale(width, height);

  const tw = useTypewriter(prompt, {
    cps: AI_TYPING_CPS,
    speed,
    startFrame: AI_TYPING_START,
  });
  const showText = tw.count > 0;
  const morph = morphProgressAt(frame, { fps, speed });

  const intro = introBounceIn(frame * speed, fps);
  const headingFade = fadeUpAt(frame * speed, [4, 20]);
  const boxFade = fadeUpAt(frame * speed, [10, 26]);

  const boxWidth = 880;
  const boxLeft = (refW - boxWidth) / 2;
  const boxTop = 270;
  const boxHeight = 150;
  const btnSize = 40;

  return (
    <AbsoluteFill style={{ background: t.page, fontFamily }}>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: refW,
          height: 720,
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 150,
            width: refW,
            textAlign: "center",
            fontSize: 44,
            fontWeight: 700,
            color: t.fg,
            opacity: headingFade.opacity,
            transform: `translateY(${headingFade.translateY + intro.translateY * 0.4}px)`,
          }}
        >
          {greeting}
        </div>

        <div
          style={{
            position: "absolute",
            left: boxLeft,
            top: boxTop,
            width: boxWidth,
            height: boxHeight,
            background: t.boxBg,
            border: `1px solid ${t.boxBorder}`,
            borderRadius: 16,
            boxShadow: "0 8px 40px -16px rgba(0,0,0,0.8)",
            opacity: boxFade.opacity,
            transform: `translateY(${boxFade.translateY + intro.translateY * 0.6}px) scale(${intro.scale})`,
            transformOrigin: "center top",
            display: "flex",
            flexDirection: "column",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              flex: 1,
              padding: "18px 20px",
              fontSize: 18,
              color: t.fg,
              display: "flex",
              alignItems: "flex-start",
              overflow: "hidden",
            }}
          >
            {showText ? (
              <span style={{ color: t.fg, whiteSpace: "pre-wrap" }}>
                {tw.text}
                <Caret
                  color={t.fg}
                  blink={!tw.typing}
                  speed={speed}
                  height={20}
                  marginLeft={2}
                />
              </span>
            ) : (
              <span
                style={{
                  color: t.fgMuted,
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                <Caret
                  color={t.fg}
                  blink={!tw.typing}
                  speed={speed}
                  height={20}
                />
                <span style={{ marginLeft: 6 }}>{placeholder}</span>
              </span>
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
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <PlusIcon size={20} color={t.iconColor} />
              <div
                style={{ display: "inline-flex", alignItems: "center", gap: 7 }}
              >
                <V0LogoIcon size={18} color={t.fg} />
                <span style={{ fontSize: 15, fontWeight: 500, color: t.fg }}>
                  {modelName}
                </span>
                <ChevronDownIcon size={14} color={t.fgMuted} />
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
              >
                <span style={{ fontSize: 15, color: t.fgMuted }}>
                  {projectName}
                </span>
                <ChevronDownIcon size={14} color={t.fgMuted} />
              </div>

              <div
                style={{
                  position: "relative",
                  width: btnSize,
                  height: btnSize,
                  borderRadius: 10,
                  background: t.btnBg,
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: 1 - morph,
                    transform: `scale(${1 - 0.08 * morph})`,
                  }}
                >
                  <MicIcon size={20} color={t.btnFg} />
                </div>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: morph,
                    transform: `scale(${0.85 + 0.15 * morph})`,
                  }}
                >
                  <ArrowUpIcon size={20} color={t.btnFg} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
