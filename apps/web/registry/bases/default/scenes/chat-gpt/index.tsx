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
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export type ChatGptProps = {
  greeting?: string;
  placeholder?: string;
  prompt?: string;
  accentColor?: string;
  theme?: "light" | "dark";
};

const SUGGESTIONS = [
  { label: "Create image", color: "#16a34a" },
  { label: "Brainstorm", color: "#d9a300" },
  { label: "Summarize text", color: "#f97316" },
  { label: "Code", color: "#6366f1" },
  { label: "Help me write", color: "#c026d3" },
  { label: "More", color: "#737373" },
];

const TOOLS = [
  { title: "Picture", subtitle: "Use DALL-E", icon: "brush" },
  { title: "Search", subtitle: "Find on the web", icon: "globe" },
  { title: "Reason", subtitle: "Use o1-preview", icon: "bulb" },
  { title: "Canvas", subtitle: "Collaborate on writing and code", icon: "pen" },
];

const THEMES = {
  light: {
    page: "#ffffff",
    composer: "#f4f4f4",
    border: "#e5e5e5",
    fg: "#0d0d0d",
    muted: "#6b6b6b",
    chip: "#ffffff",
    menu: "#ffffff",
    menuHover: "#ececec",
    sendBg: "#0d0d0d",
    sendFg: "#ffffff",
  },
  dark: {
    page: "#212121",
    composer: "#2f2f2f",
    border: "#3f3f3f",
    fg: "#f5f5f5",
    muted: "#b4b4b4",
    chip: "#2f2f2f",
    menu: "#2f2f2f",
    menuHover: "#3a3a3a",
    sendBg: "#f5f5f5",
    sendFg: "#0d0d0d",
  },
} as const;

const Icon: React.FC<{ name: string; color: string; size?: number }> = ({
  name,
  color,
  size = 22,
}) => {
  const common = {
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none",
  };

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      {name === "paperclip" ? (
        <path
          {...common}
          d="M21.4 11.6 12 21a6 6 0 0 1-8.5-8.5l9.7-9.7a4.2 4.2 0 0 1 6 6L9.5 18.5a2.4 2.4 0 0 1-3.4-3.4l9-9"
        />
      ) : name === "gift" ? (
        <>
          <path {...common} d="M20 12v8H4v-8" />
          <path {...common} d="M2.5 7h19v5h-19zM12 7v13" />
          <path {...common} d="M12 7H8.3A2.3 2.3 0 1 1 12 4.2V7zM12 7h3.7A2.3 2.3 0 1 0 12 4.2V7z" />
        </>
      ) : name === "globe" ? (
        <>
          <circle {...common} cx="12" cy="12" r="9" />
          <path {...common} d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
        </>
      ) : name === "brush" ? (
        <>
          <path {...common} d="M15 5.5 18.5 9 9 18.5H5.5V15L15 5.5z" />
          <path {...common} d="M13.5 7 17 10.5" />
        </>
      ) : name === "bulb" ? (
        <>
          <path {...common} d="M9 18h6M10 21h4" />
          <path {...common} d="M8 14a6 6 0 1 1 8 0c-1 1-1.5 2-1.5 3h-5c0-1-.5-2-1.5-3z" />
        </>
      ) : name === "pen" ? (
        <>
          <path {...common} d="M4 20h4l10.5-10.5-4-4L4 16v4z" />
          <path {...common} d="m13.5 6.5 4 4" />
        </>
      ) : (
        <path {...common} d="M12 19V5M6 11l6-6 6 6" />
      )}
    </svg>
  );
};

export const ChatGpt: React.FC<ChatGptProps> = ({
  greeting = "What can I help with?",
  placeholder = "Message ChatGPT",
  prompt = "Make a sunset over a calm ocean",
  accentColor = "#10a37f",
  theme = "light",
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = THEMES[theme];
  const scale = stageScale(width, height);
  const tw = useTypedPrompt({ prompt, startFrame: 36, cps: 24 });
  const morph = morphProgress(frame, fps, 76);
  const intro = introBounce(frame, fps);
  const heading = fadeUp(frame, [4, 20]);
  const composer = fadeUp(frame, [10, 26]);
  const chips = fadeUp(frame, [18, 34]);
  const menu = fadeUp(frame, [24, 38]);
  const menuClear = Math.min(1, morph * 4);

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
          color: t.fg,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 24,
            top: 22,
            width: 34,
            height: 34,
            borderRadius: 8,
            display: "grid",
            placeItems: "center",
            color: t.muted,
            border: `1px solid ${t.border}`,
            fontSize: 18,
          }}
        >
          =
        </div>
        <div
          style={{
            position: "absolute",
            top: 160,
            width: "100%",
            textAlign: "center",
            fontSize: 34,
            lineHeight: 1.1,
            fontWeight: 650,
            opacity: heading.opacity,
            transform: `translateY(${heading.translateY}px)`,
          }}
        >
          {greeting}
        </div>

        <div
          style={{
            position: "absolute",
            left: 96,
            top: 246,
            width: 1088,
            minHeight: 126,
            borderRadius: 28,
            background: t.composer,
            opacity: composer.opacity,
            transform: `translateY(${composer.translateY + intro.translateY * 0.35}px) scale(${intro.scale})`,
            transformOrigin: "center top",
            boxShadow:
              theme === "light"
                ? "0 1px 0 rgba(0,0,0,0.03)"
                : "inset 0 0 0 1px rgba(255,255,255,0.04)",
          }}
        >
          <div
            style={{
              minHeight: 64,
              padding: "20px 28px 8px",
              fontSize: 21,
              lineHeight: 1.35,
              color: tw.count > 0 ? t.fg : t.muted,
            }}
          >
            {tw.count > 0 ? (
              <>
                {tw.text}
                <BlockCaret color={t.fg} blink={!tw.typing} height={22} />
              </>
            ) : (
              placeholder
            )}
          </div>

          <div
            style={{
              height: 54,
              padding: "0 14px 14px 24px",
              display: "flex",
              alignItems: "center",
              gap: 18,
            }}
          >
            <Icon name="paperclip" color={t.fg} size={24} />
            <Icon name="gift" color={t.fg} size={24} />
            <Icon name="globe" color={t.muted} size={24} />
            <div style={{ flex: 1 }} />
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: morph > 0.05 ? t.sendBg : "#0d0d0d",
                display: "grid",
                placeItems: "center",
                color: morph > 0.05 ? t.sendFg : "#ffffff",
                scale: 0.92 + morph * 0.08,
              }}
            >
              {morph > 0.45 ? <Icon name="send" color={t.sendFg} size={21} /> : "|||"}
            </div>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            left: 112,
            top: 386,
            width: 420,
            borderRadius: 14,
            padding: 12,
            background: t.menu,
            border: `1px solid ${t.border}`,
            boxShadow:
              theme === "light"
                ? "0 20px 48px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.08)"
                : "0 20px 48px rgba(0,0,0,0.38)",
            opacity: menu.opacity * Math.max(0, 1 - morph * 4),
            transform: `translateY(${menu.translateY}px)`,
          }}
        >
          {TOOLS.map((tool, index) => (
            <div
              key={tool.title}
              style={{
                minHeight: 66,
                borderRadius: 10,
                display: "grid",
                gridTemplateColumns: "42px 1fr",
                alignItems: "center",
                padding: "6px 14px",
                background: index === 0 ? t.menuHover : "transparent",
                color: t.fg,
              }}
            >
              <Icon name={tool.icon} color={index === 0 ? accentColor : t.muted} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 500 }}>{tool.title}</div>
                <div style={{ marginTop: 3, color: t.muted, fontSize: 16 }}>
                  {tool.subtitle}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            top: 398,
            width: "100%",
            display: "flex",
            justifyContent: "center",
            gap: 12,
            opacity: chips.opacity * menuClear * (1 - morph * 0.35),
            transform: `translateY(${chips.translateY}px)`,
          }}
        >
          {SUGGESTIONS.map((chip) => (
            <div
              key={chip.label}
              style={{
                height: 50,
                padding: "0 18px",
                borderRadius: 26,
                background: t.chip,
                border: `1px solid ${t.border}`,
                color: t.muted,
                fontSize: 17,
                display: "flex",
                alignItems: "center",
                gap: 10,
                boxShadow: theme === "light" ? "0 1px 4px rgba(0,0,0,0.05)" : "none",
              }}
            >
              <span
                style={{
                  width: 17,
                  height: 17,
                  borderRadius: 5,
                  border: `2px solid ${chip.color}`,
                }}
              />
              {chip.label}
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
