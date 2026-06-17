import { loadFont } from "@remotion/google-fonts/Inter";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { DELAY, DURATION, EASING, STAGGER } from "@/remotion/lib/motion-tokens";

const { fontFamily } = loadFont("normal", {
  weights: ["500", "600", "700"],
  subsets: ["latin"],
});

export type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

export type ChatToPreviewProps = {
  messages?: ChatMessage[];
  previewTitle?: string;
  previewCaption?: string;
  morphStartFrame?: number;
  backgroundColor?: string;
  accentColor?: string;
};

const COLORS = {
  bg: "#080810",
  panel: "rgba(10,12,20,0.94)",
  border: "rgba(148,163,184,0.14)",
  user: "#1a1f2d",
  assistant: "rgba(232,184,109,0.12)",
  text: "#f4f4f5",
  muted: "#94a3b8",
  accent: "#e8b86d",
  teal: "#2dd4bf",
} as const;

const DEFAULT_MESSAGES: ChatMessage[] = [
  { role: "user", text: "Show the title card with a phosphor accent." },
  { role: "assistant", text: "Rendering a centered title scene with rim light." },
];

export const ChatToPreview: React.FC<ChatToPreviewProps> = ({
  messages = DEFAULT_MESSAGES,
  previewTitle = "Ship the scene",
  previewCaption = "Chat layout morphs into a live preview frame.",
  morphStartFrame = DELAY.medium + DURATION.normal,
  backgroundColor = COLORS.bg,
  accentColor = COLORS.accent,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const safe = getSafeAreaPadding({ width, height });
  const isPortrait = height > width;
  const contentWidth = width - safe.paddingLeft - safe.paddingRight;
  const contentHeight = height - safe.paddingTop - safe.paddingBottom;
  const morph = interpolate(
    frame,
    [morphStartFrame, morphStartFrame + DURATION.slow],
    [0, 1],
    {
      easing: EASING.enter,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const chatOpacity = 1 - morph;
  const previewEnter = spring({
    frame: frame - morphStartFrame,
    fps,
    config: { damping: 18, stiffness: 120, mass: 0.85 },
    durationInFrames: DURATION.normal,
  });
  const layoutGap = scaleFont(isPortrait ? 24 : 32, width);
  const chatWidth = contentWidth * (1 - morph * 0.42);
  const previewWidth = contentWidth - chatWidth - layoutGap * (1 - morph);

  return (
    <div
      style={{
        width,
        height,
        paddingLeft: safe.paddingLeft,
        paddingRight: safe.paddingRight,
        paddingTop: safe.paddingTop,
        paddingBottom: safe.paddingBottom,
        background: `radial-gradient(circle at 18% 16%, ${accentColor}1c, transparent 34%), ${backgroundColor}`,
        fontFamily,
        display: "flex",
        flexDirection: isPortrait ? "column" : "row",
        gap: layoutGap,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 90% 30% at 50% 0%, ${accentColor}14, transparent 70%)`,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          flex: isPortrait ? `0 0 ${contentHeight * (0.46 - morph * 0.18)}px` : `0 0 ${chatWidth}px`,
          minWidth: 0,
          display: "grid",
          gap: scaleFont(16, width),
          alignContent: "start",
          opacity: chatOpacity,
          transform: `translateY(${(1 - chatOpacity) * scaleFont(-20, width)}px) scale(${1 - morph * 0.04})`,
        }}
      >
        {messages.map((message, index) => {
          const delay = index * STAGGER.relaxed;
          const enter = interpolate(
            frame,
            [delay, delay + DURATION.fast],
            [0, 1],
            {
              easing: EASING.enter,
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          );

          return (
            <div
              key={`${message.role}-${index}`}
              style={{
                justifySelf: message.role === "user" ? "end" : "start",
                maxWidth: "92%",
                padding: `${scaleFont(14, width)}px ${scaleFont(18, width)}px`,
                borderRadius: scaleFont(18, width),
                background:
                  message.role === "user" ? COLORS.user : COLORS.assistant,
                border: `1px solid ${message.role === "user" ? COLORS.border : `${accentColor}33`}`,
                color: COLORS.text,
                fontSize: scaleFont(24, width),
                lineHeight: 1.35,
                fontWeight: 500,
                opacity: enter,
                transform: `translateY(${(1 - enter) * scaleFont(12, width)}px)`,
              }}
            >
              {message.text}
            </div>
          );
        })}
      </div>

      <div
        style={{
          flex: 1,
          minWidth: 0,
          minHeight: isPortrait ? contentHeight * (0.42 + morph * 0.18) : contentHeight,
          borderRadius: scaleFont(22, width),
          background: COLORS.panel,
          border: `1px solid ${COLORS.border}`,
          overflow: "hidden",
          opacity: morph > 0.05 ? Math.min(1, previewEnter) : 0,
          transform: `translateY(${(1 - previewEnter) * scaleFont(24, width)}px) scale(${0.94 + previewEnter * 0.06})`,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.12), 0 ${scaleFont(24, width)}px ${scaleFont(72, width)}px rgba(0,0,0,0.38)`,
          display: "grid",
          gridTemplateRows: "auto 1fr auto",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: scaleFont(8, width),
            padding: `${scaleFont(14, width)}px ${scaleFont(18, width)}px`,
            borderBottom: `1px solid ${COLORS.border}`,
          }}
        >
          {["#f87171", "#fbbf24", "#34d399"].map((color) => (
            <div
              key={color}
              style={{
                width: scaleFont(10, width),
                height: scaleFont(10, width),
                borderRadius: "50%",
                background: color,
              }}
            />
          ))}
          <div
            style={{
              marginLeft: "auto",
              color: COLORS.muted,
              fontSize: scaleFont(16, width),
              fontWeight: 600,
            }}
          >
            Preview
          </div>
        </div>
        <div
          style={{
            display: "grid",
            placeItems: "center",
            padding: scaleFont(28, width),
            background: `radial-gradient(circle at 50% 30%, ${accentColor}22, transparent 55%), linear-gradient(180deg, #0d1018, #070912)`,
          }}
        >
          <div
            style={{
              width: "72%",
              height: scaleFont(8, width),
              borderRadius: 999,
              background: accentColor,
              marginBottom: scaleFont(18, width),
              boxShadow: `0 0 ${scaleFont(18, width)}px ${accentColor}66`,
              transform: `scaleX(${0.2 + previewEnter * 0.8})`,
              transformOrigin: "left center",
            }}
          />
          <h2
            style={{
              margin: 0,
              color: COLORS.text,
              fontSize: scaleFont(isPortrait ? 56 : 48, width),
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              textAlign: "center",
            }}
          >
            {previewTitle}
          </h2>
        </div>
        <div
          style={{
            padding: `${scaleFont(14, width)}px ${scaleFont(18, width)}px`,
            color: COLORS.teal,
            fontSize: scaleFont(18, width),
            fontWeight: 600,
            borderTop: `1px solid ${COLORS.border}`,
          }}
        >
          {previewCaption}
        </div>
      </div>
    </div>
  );
};
