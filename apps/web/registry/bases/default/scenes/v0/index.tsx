import { loadFont } from "@remotion/google-fonts/Inter";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import {
  AI_TYPING_CPS,
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
  prompt = "a landing page with pricing",
  modelName = "v0 Max",
  projectName = "Project",
  theme = "dark",
  speed = 1,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = THEMES[theme];

  // Reference box is cropped to the greeting-plus-composer band, the way
  // `claude-chat` crops to its card. On the full 1280x720 page the composer was
  // 14% of the frame area and the bottom 45% was empty page colour, which reads
  // as a thin bar once the frame is scaled to a 308px tile.
  const refW = 1000;
  const refH = 560;
  const scale = stageScale(width, height, refW, refH);
  const fs = frame * speed;

  const tw = useTypewriter(prompt, {
    cps: AI_TYPING_CPS,
    speed,
    startFrame: AI_TYPING_START,
  });
  const morph = morphProgressAt(frame, { fps, speed });
  // The prompt has to land somewhere. Typing alone runs to the end of the
  // window and the clip loops mid-word; the send beat is scheduled off the
  // prompt length so it always follows the last character.
  const send = sendBeatAt(fs, {
    promptLength: prompt.length,
    fps,
    cps: AI_TYPING_CPS,
    startFrame: AI_TYPING_START,
  });
  // Once it is sent the composer is empty again and the prompt is in the thread.
  const showText = tw.count > 0 && !send.sent;

  const intro = introBounceIn(fs, fps);
  const headingFade = fadeUpAt(fs, [4, 20]);
  const boxFade = fadeUpAt(fs, [10, 26]);

  const boxWidth = 900;
  const boxLeft = (refW - boxWidth) / 2;
  const boxTop = 300;
  const boxHeight = 170;
  const btnSize = 48;

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
              left: boxLeft,
              top: 96,
              width: boxWidth,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 20,
              opacity: send.bubble,
              translate: `0 ${((1 - send.bubble) * 24).toFixed(2)}px`,
            }}
          >
            <div
              style={{
                maxWidth: boxWidth * 0.74,
                padding: "18px 26px",
                borderRadius: 18,
                background: t.boxBg,
                border: `1px solid ${t.boxBorder}`,
                color: t.fg,
                fontSize: 26,
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
                    background: t.fg,
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
            left: 0,
            top: 168,
            width: refW,
            textAlign: "center",
            fontSize: 52,
            fontWeight: 700,
            color: t.fg,
            // The greeting is the empty state. It clears as the prompt leaves
            // the composer, so the thread row above is never talking over it.
            opacity: headingFade.opacity * (1 - send.bubble),
            translate: `0 ${(headingFade.translateY + intro.translateY * 0.4).toFixed(2)}px`,
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
            translate: `0 ${(boxFade.translateY + intro.translateY * 0.6).toFixed(2)}px`,
            // Dips on the send press, so the button reads as pressed rather
            // than as the prompt simply vanishing.
            scale: `${(intro.scale - 0.012 * send.press).toFixed(4)}`,
            transformOrigin: "center top",
            display: "flex",
            flexDirection: "column",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              flex: 1,
              padding: "22px 24px",
              fontSize: 26,
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
                  height={28}
                  marginLeft={3}
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
                  height={28}
                />
                <span style={{ marginLeft: 8 }}>{placeholder}</span>
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
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <PlusIcon size={24} color={t.iconColor} />
              <div
                style={{ display: "inline-flex", alignItems: "center", gap: 7 }}
              >
                <V0LogoIcon size={22} color={t.fg} />
                <span style={{ fontSize: 19, fontWeight: 500, color: t.fg }}>
                  {modelName}
                </span>
                <ChevronDownIcon size={17} color={t.fgMuted} />
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
              >
                <span style={{ fontSize: 19, color: t.fgMuted }}>
                  {projectName}
                </span>
                <ChevronDownIcon size={17} color={t.fgMuted} />
              </div>

              <div
                style={{
                  position: "relative",
                  width: btnSize,
                  height: btnSize,
                  borderRadius: 12,
                  background: t.btnBg,
                  flexShrink: 0,
                  // Visible press on the send beat.
                  scale: `${(1 - 0.12 * send.press).toFixed(4)}`,
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
                    scale: `${(1 - 0.08 * morph).toFixed(4)}`,
                  }}
                >
                  <MicIcon size={24} color={t.btnFg} />
                </div>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: morph,
                    scale: `${(0.85 + 0.15 * morph).toFixed(4)}`,
                  }}
                >
                  <ArrowUpIcon size={24} color={t.btnFg} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
