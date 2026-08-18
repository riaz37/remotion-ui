import { loadFont } from "@remotion/google-fonts/Inter";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import {
  AI_TYPING_START,
  Caret,
  fadeUpAt,
  introBounceIn,
  morphProgressAt,
  replyDotOpacity,
  sendBeatAt,
  stageScale,
  useTypewriter,
} from "@/remotion/lib/ai-composer-utils";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export type ClaudeChatProps = {
  placeholder?: string;
  prompt?: string;
  modelName?: string;
  modelTier?: string;
  accentColor?: string;
  theme?: "light" | "dark";
  speed?: number;
};

type Theme = {
  page: string;
  cardBg: string;
  cardBorder: string;
  fg: string;
  fgMuted: string;
  placeholder: string;
  iconBtnBorder: string;
};

export const THEMES: Record<"light" | "dark", Theme> = {
  light: {
    page: "#F5F4EF",
    cardBg: "#FFFFFF",
    cardBorder: "#E8E5DD",
    fg: "#1F1E1D",
    fgMuted: "#73726C",
    placeholder: "#A3A097",
    iconBtnBorder: "#E0DDD4",
  },
  dark: {
    page: "#262624",
    cardBg: "#1F1E1D",
    cardBorder: "#3A3936",
    fg: "#F0EEE6",
    fgMuted: "#9B9892",
    placeholder: "#73726C",
    iconBtnBorder: "#3A3936",
  },
};

const TYPING_CPS = 22;

function ChevronDown({ size, color }: { size: number; color: string }) {
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

function WaveformIcon({ size, color }: { size: number; color: string }) {
  const bars = [
    { x: 4, h: 8 },
    { x: 9, h: 16 },
    { x: 14, h: 12 },
    { x: 19, h: 20 },
  ];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <title>Voice</title>
      {bars.map((bar) => (
        <rect
          key={bar.x}
          x={bar.x - 1}
          y={(24 - bar.h) / 2}
          width={2.4}
          height={bar.h}
          rx={1.2}
          fill={color}
        />
      ))}
    </svg>
  );
}

function SendIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <title>Send</title>
      <path
        d="M12 19V5M12 5l-6 6M12 5l6 6"
        stroke="#FFFFFF"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconButton({
  size,
  border,
  children,
}: {
  size: number;
  border: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "100%",
        border: `1px solid ${border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {children}
    </div>
  );
}

export const ClaudeChat: React.FC<ClaudeChatProps> = ({
  placeholder = "Try: draft an email · summarize a doc · plan your week",
  prompt = "Draft a launch tweet",
  modelName = "Opus 4.8",
  modelTier = "Max",
  accentColor = "#D97757",
  theme = "light",
  speed = 1,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = THEMES[theme];

  // Reference box is cropped to the composer itself. A full 16:9 page left the
  // card as a thin bar on an empty field once the frame was scaled to a tile.
  const refW = 980;
  const refH = 560;
  const scale = stageScale(width, height, refW, refH);
  const fs = frame * speed;

  const tw = useTypewriter(prompt, {
    cps: TYPING_CPS,
    speed,
    startFrame: AI_TYPING_START,
  });
  const morph = morphProgressAt(frame, { fps, speed });
  const send = sendBeatAt(fs, {
    promptLength: prompt.length,
    fps,
    cps: TYPING_CPS,
    startFrame: AI_TYPING_START,
  });
  // Once it is sent the composer is empty again and the prompt is in the thread.
  const showText = tw.count > 0 && !send.sent;

  const intro = introBounceIn(fs, fps);
  const cardFade = fadeUpAt(fs, [6, 22]);

  const cardWidth = 900;
  const cardLeft = (refW - cardWidth) / 2;
  const cardTop = 200;
  const iconBtnSize = 44;
  const morphSize = 48;

  return (
    <AbsoluteFill style={{ background: t.page, fontFamily }}>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: refW,
          height: refH,
          translate: "-50% -50%",
          scale: `${scale}`,
        }}
      >
        {send.bubble > 0 ? (
          <div
            style={{
              position: "absolute",
              left: cardLeft,
              top: 62,
              width: cardWidth,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 18,
              opacity: send.bubble,
              translate: `0 ${(1 - send.bubble) * 22}px`,
            }}
          >
            <div
              style={{
                maxWidth: cardWidth * 0.72,
                padding: "18px 26px",
                borderRadius: 22,
                background: t.cardBg,
                border: `1px solid ${t.cardBorder}`,
                color: t.fg,
                fontSize: 25,
                lineHeight: 1.35,
              }}
            >
              {prompt}
            </div>
            <div
              style={{
                alignSelf: "flex-start",
                display: "flex",
                alignItems: "center",
                gap: 10,
                opacity: send.reply,
              }}
            >
              {[0, 1, 2].map((dot) => (
                <span
                  key={dot}
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "100%",
                    background: accentColor,
                    opacity: replyDotOpacity(fs, dot, fps),
                  }}
                />
              ))}
            </div>
          </div>
        ) : null}

        <div
          style={{
            position: "absolute",
            left: cardLeft,
            top: cardTop,
            width: cardWidth,
            background: t.cardBg,
            border: `1px solid ${t.cardBorder}`,
            borderRadius: 26,
            boxShadow: "0 8px 30px -12px rgba(31,30,29,0.12)",
            opacity: cardFade.opacity,
            translate: `0 ${cardFade.translateY + intro.translateY}px`,
            scale: `${intro.scale * (1 - 0.02 * send.press)}`,
            transformOrigin: "center top",
          }}
        >
          <div
            style={{
              padding: "34px 32px",
              minHeight: 96,
              fontSize: 26,
              lineHeight: 1.3,
              display: "flex",
              alignItems: "center",
            }}
          >
            {showText ? (
              <span style={{ color: t.fg }}>
                {tw.text}
                <Caret
                  color={t.fg}
                  blink={!tw.typing}
                  speed={speed}
                  height={30}
                  radius={0}
                  marginLeft={1}
                  style={{
                    verticalAlign: "text-bottom",
                    transform: "translateY(3px)",
                  }}
                />
              </span>
            ) : (
              <span
                style={{
                  color: t.placeholder,
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                <Caret
                  color={t.fg}
                  blink={!tw.typing}
                  speed={speed}
                  height={30}
                  radius={0}
                  marginLeft={1}
                  style={{
                    verticalAlign: "text-bottom",
                    transform: "translateY(3px)",
                  }}
                />
                <span style={{ marginLeft: 2 }}>{placeholder}</span>
              </span>
            )}
          </div>

          <div
            style={{
              padding: "16px 22px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <IconButton size={iconBtnSize} border={t.iconBtnBorder}>
              <PlusIcon size={24} color={t.fg} />
            </IconButton>

            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{ fontSize: 22, fontWeight: 500, color: t.fg }}
                >
                  {modelName}
                </span>
                <span
                  style={{ fontSize: 22, fontWeight: 400, color: t.fgMuted }}
                >
                  {modelTier}
                </span>
                <ChevronDown size={19} color={t.fgMuted} />
              </div>

              <IconButton size={iconBtnSize} border={t.iconBtnBorder}>
                <MicIcon size={24} color={t.fg} />
              </IconButton>

              <div
                style={{
                  position: "relative",
                  width: morphSize,
                  height: morphSize,
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
                    borderRadius: "100%",
                    border: `1px solid ${t.iconBtnBorder}`,
                    opacity: 1 - morph,
                    scale: `${1 - 0.1 * morph}`,
                  }}
                >
                  <WaveformIcon size={26} color={t.fg} />
                </div>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 12,
                    background: accentColor,
                    opacity: morph,
                    scale: `${(0.8 + 0.2 * morph) * (1 - 0.16 * send.press)}`,
                  }}
                >
                  <SendIcon size={26} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
