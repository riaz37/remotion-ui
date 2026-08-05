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
  weights: ["400", "600", "700"],
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
  speed?: number;
};

type Theme = {
  page: string;
  boxBg: string;
  fg: string;
  fgMuted: string;
  fgQuery: string;
};

export const THEMES: Record<"light" | "dark", Theme> = {
  light: {
    page: "#FFFFFF",
    boxBg: "#F2F2F2",
    fg: "#111111",
    fgMuted: "#888888",
    fgQuery: "#555555",
  },
  dark: {
    page: "#000000",
    boxBg: "#161616",
    fg: "#EDEDED",
    fgMuted: "#6B6B6B",
    fgQuery: "#9A9A9A",
  },
};

const TYPING_CPS = 20;

function Wordmark() {
  return (
    <svg width={468} height={84} viewBox="0 0 234 42" fill="none">
      <title>opencode</title>
      <clipPath id="opencode-wordmark-clip">
        <rect width={234} height={42} fill="#ffffff" />
      </clipPath>
      <g clipPath="url(#opencode-wordmark-clip)">
        <path d="M18 30H6V18H18V30Z" fill="#4B4646" />
        <path d="M18 12H6V30H18V12ZM24 36H0V6H24V36Z" fill="#B7B1B1" />
        <path d="M48 30H36V18H48V30Z" fill="#4B4646" />
        <path d="M36 30H48V12H36V30ZM54 36H36V42H30V6H54V36Z" fill="#B7B1B1" />
        <path d="M84 24V30H66V24H84Z" fill="#4B4646" />
        <path
          d="M84 24H66V30H84V36H60V6H84V24ZM66 18H78V12H66V18Z"
          fill="#B7B1B1"
        />
        <path d="M108 36H96V18H108V36Z" fill="#4B4646" />
        <path
          d="M108 12H96V36H90V6H108V12ZM114 36H108V12H114V36Z"
          fill="#B7B1B1"
        />
        <path d="M144 30H126V18H144V30Z" fill="#4B4646" />
        <path d="M144 12H126V30H144V36H120V6H144V12Z" fill="#F1ECEC" />
        <path d="M168 30H156V18H168V30Z" fill="#4B4646" />
        <path d="M168 12H156V30H168V12ZM174 36H150V6H174V36Z" fill="#F1ECEC" />
        <path d="M198 30H186V18H198V30Z" fill="#4B4646" />
        <path
          d="M198 12H186V30H198V12ZM204 36H180V6H198V0H204V36Z"
          fill="#F1ECEC"
        />
        <path d="M234 24V30H216V24H234Z" fill="#4B4646" />
        <path
          d="M216 12V18H228V12H216ZM234 24H216V30H234V36H210V6H234V24Z"
          fill="#F1ECEC"
        />
      </g>
    </svg>
  );
}

export const Opencode: React.FC<OpencodeProps> = ({
  placeholder = "Ask anything... ",
  query = '"What is the tech stack of this project?"',
  agentName = "Build",
  modelName = "Kimi K2.5",
  provider = "Moonshot AI",
  accentColor = "#2B7FFF",
  theme = "dark",
  speed = 1,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = THEMES[theme];
  const scale = stageScale(width, height);

  const tw = useTypewriter(query, {
    cps: TYPING_CPS,
    speed,
    startFrame: AI_TYPING_START_TUI,
  });

  const intro = introBounceIn(frame * speed, fps);
  const logoFade = fadeUpAt(frame * speed, [4, 22]);
  const boxFade = fadeUpAt(frame * speed, [12, 30]);
  const hintsFade = fadeUpAt(frame * speed, [20, 38]);

  const boxWidth = 1000;

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
            lineHeight: 0,
            opacity: logoFade.opacity,
            transform: `translateY(${logoFade.translateY + intro.translateY * 0.4}px)`,
          }}
        >
          <Wordmark />
        </div>

        <div
          style={{
            width: boxWidth,
            marginTop: 40,
            minHeight: 150,
            background: t.boxBg,
            borderLeft: `4px solid ${accentColor}`,
            padding: "26px 28px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 26,
            opacity: boxFade.opacity,
            transform: `translateY(${boxFade.translateY + intro.translateY * 0.6}px) scale(${intro.scale})`,
            transformOrigin: "center top",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              fontSize: 22,
            }}
          >
            <span style={{ color: t.fgMuted }}>{placeholder}</span>
            {tw.count > 0 ? (
              <span style={{ color: t.fgQuery }}>{tw.text}</span>
            ) : null}
            <span style={{ opacity: 0.6, display: "inline-flex" }}>
              <Caret
                width={12}
                height={24}
                color={t.fg}
                blink={!tw.typing}
                speed={speed}
                marginLeft={2}
              />
            </span>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 16,
              fontSize: 20,
            }}
          >
            <span style={{ color: accentColor, fontWeight: 600 }}>
              {agentName}
            </span>
            <span style={{ color: t.fg }}>{modelName}</span>
            <span style={{ color: t.fgMuted }}>{provider}</span>
          </div>
        </div>

        <div
          style={{
            width: boxWidth,
            marginTop: 18,
            display: "flex",
            justifyContent: "flex-end",
            gap: 22,
            fontSize: 18,
            opacity: hintsFade.opacity,
            transform: `translateY(${hintsFade.translateY}px)`,
          }}
        >
          <span style={{ display: "inline-flex", gap: 8 }}>
            <span style={{ color: t.fg, fontWeight: 700 }}>tab</span>
            <span style={{ color: t.fgMuted }}>agents</span>
          </span>
          <span style={{ display: "inline-flex", gap: 8 }}>
            <span style={{ color: t.fg, fontWeight: 700 }}>ctrl+p</span>
            <span style={{ color: t.fgMuted }}>commands</span>
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
