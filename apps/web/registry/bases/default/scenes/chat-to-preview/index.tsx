import { loadFont } from "@remotion/google-fonts/Inter";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CODE_THEMES } from "@/remotion/lib/code-syntax";
import { getSafeAreaPadding } from "@/remotion/lib/layout";
import { EASING } from "@/remotion/lib/motion-tokens";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

export type ChatToPreviewProps = {
  /** The exchange, in order. User turns type and send; assistant turns stream. */
  messages?: ChatMessage[];
  /** Title the finished preview renders. */
  previewTitle?: string;
  /** Supporting line under the preview title. */
  previewCaption?: string;
  /** Name of the preview surface, shown in its header — or its tab title. */
  previewLabel?: string;
  /**
   * Address the preview is loading. Pass it to render the surface as a real
   * browser — tab strip, URL bar and a load bar tied to the build — instead of
   * a bare titled panel.
   */
  previewUrl?: string;
  /** Placeholder in the composer before anything is typed. */
  placeholder?: string;
  accentColor?: string;
  backgroundColor?: string;
  theme?: "dark" | "light";
  /** Animation speed multiplier. */
  speed?: number;
};

const DEFAULT_MESSAGES: ChatMessage[] = [
  { role: "user", text: "Open on a title card with a phosphor accent." },
  { role: "assistant", text: "Building a centred title scene with rim light." },
];

/** Characters typed per second in the composer. */
const TYPE_CPS = 38;
/** Words streamed per second by the assistant. */
const STREAM_WPS = 8;

/** Beat plan in seconds. */
const T = {
  /** First keystroke. */
  start: 0.5,
  /** Held after the composer fills, before the send. */
  beforeSend: 0.2,
  /** Bubble flight from the composer into the thread. */
  send: 0.34,
  /** Assistant pause before it starts answering. */
  think: 0.62,
  /** Gap after a turn finishes. */
  turnGap: 0.24,
  /** How long the preview takes to assemble once the answer starts. */
  build: 1.9,
  /** Fade from wireframe to the rendered result. */
  resolve: 0.5,
} as const;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

type Turn = {
  message: ChatMessage;
  /** Composer typing window (user turns only). */
  typeFrom: number;
  /** When the bubble exists in the thread. */
  landAt: number;
  /** Streaming window start (assistant turns only). */
  streamFrom: number;
};

/** Lay the exchange out on one clock, so no beat needs a magic frame number. */
function schedule(messages: ChatMessage[]): Turn[] {
  let cursor = T.start;
  return messages.map((message) => {
    if (message.role === "user") {
      const typeFrom = cursor;
      const landAt = typeFrom + message.text.length / TYPE_CPS + T.beforeSend;
      cursor = landAt + T.send + T.turnGap;
      return { message, typeFrom, landAt, streamFrom: 0 };
    }
    const landAt = cursor;
    const streamFrom = landAt + T.think;
    cursor = streamFrom + message.text.split(/\s+/).length / STREAM_WPS + T.turnGap;
    return { message, typeFrom: 0, landAt, streamFrom };
  });
}

const CheckGlyph: React.FC<{
  size: number;
  color: string;
  progress: number;
}> = ({ size, color, progress }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M4.8 12.6l4.9 4.9 9.5-10.4"
      stroke={color}
      strokeWidth={2.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={22}
      strokeDashoffset={22 * (1 - progress)}
    />
  </svg>
);

const SendGlyph: React.FC<{ size: number; color: string }> = ({
  size,
  color,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M4 11.6 20 4l-7.6 16-2.1-6.3L4 11.6Z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinejoin="round"
    />
  </svg>
);

/** Back / forward chevrons for the URL bar. */
const NavArrow: React.FC<{ size: number; color: string; flip?: boolean }> = ({
  size,
  color,
  flip,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={{ scale: flip ? "-1 1" : undefined }}
  >
    <path
      d="M14 6l-6 6 6 6"
      stroke={color}
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const LockGlyph: React.FC<{ size: number; color: string }> = ({
  size,
  color,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect
      x={5}
      y={10.5}
      width={14}
      height={9.5}
      rx={2.4}
      stroke={color}
      strokeWidth={1.9}
    />
    <path
      d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"
      stroke={color}
      strokeWidth={1.9}
      strokeLinecap="round"
    />
  </svg>
);

/** Rotating arc — a spinner that renders identically on every platform. */
const Spinner: React.FC<{ size: number; color: string; turn: number }> = ({
  size,
  color,
  turn,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={{ transform: `rotate(${turn * 360}deg)` }}
  >
    <circle
      cx={12}
      cy={12}
      r={9}
      stroke={color}
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeDasharray={`${2 * Math.PI * 9 * 0.28} ${2 * Math.PI * 9}`}
    />
  </svg>
);

/**
 * The prompt-to-render loop as it actually plays: the ask is typed into the
 * composer and sent up into the thread, the answer streams back word by word,
 * and the preview assembles alongside it — wireframe blocks first, then the
 * rendered scene — rather than one layout cross-fading into another.
 */
export const ChatToPreview: React.FC<ChatToPreviewProps> = ({
  messages = DEFAULT_MESSAGES,
  previewTitle = "Ship the scene",
  previewCaption = "Centred title, phosphor rim light",
  previewLabel = "Preview",
  previewUrl,
  placeholder = "Describe the scene…",
  accentColor = "#E8B86D",
  backgroundColor,
  theme = "dark",
  speed = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const palette = CODE_THEMES[theme];
  const safe = getSafeAreaPadding({ width, height });

  const now = (frame / fps) * speed;
  const at = (seconds: number) => (seconds * fps) / speed;
  const ease = (from: number, to: number, easing = EASING.enter) =>
    interpolate(frame, [at(from), at(to)], [0, 1], { easing, ...clamp });

  const stage = {
    x: safe.paddingLeft,
    y: safe.paddingTop,
    w: width - safe.paddingLeft - safe.paddingRight,
    h: height - safe.paddingTop - safe.paddingBottom,
  };
  const portrait = height > width;
  const u = Math.min(stage.w / 1120, stage.h / 620);
  const gap = 26 * u;

  const chat = portrait
    ? { w: stage.w, h: stage.h * 0.48 }
    : { w: stage.w * 0.42, h: stage.h };
  const preview = portrait
    ? { x: 0, y: chat.h + gap, w: stage.w, h: stage.h - chat.h - gap }
    : { x: chat.w + gap, y: 0, w: stage.w - chat.w - gap, h: stage.h };

  const turns = schedule(messages);
  // The *first* answer, not the last: in a multi-turn exchange the surface
  // starts building as soon as the assistant begins replying, and waiting for
  // the closing turn would leave the panel idle through the whole conversation.
  const answer = turns.find((turn) => turn.message.role === "assistant");
  /** In browser mode the address is submitted, so the page starts loading on
   * the first user turn rather than waiting for the assistant to speak. */
  const navigation = previewUrl
    ? turns.find((turn) => turn.message.role === "user")
    : undefined;
  /** The preview starts assembling the moment the answer starts coming back. */
  const buildFrom = navigation
    ? navigation.landAt
    : answer
      ? answer.streamFrom
      : T.start;
  const build = ease(buildFrom, buildFrom + T.build, EASING.editorial);
  const resolve = ease(
    buildFrom + T.build - 0.1,
    buildFrom + T.build - 0.1 + T.resolve,
  );
  const ready = ease(buildFrom + T.build + 0.25, buildFrom + T.build + 0.6);

  const panelIn = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 120, mass: 0.8 },
  });

  /** The user turn currently being typed, if any. */
  const typing = turns.find(
    (turn) =>
      turn.message.role === "user" && now >= turn.typeFrom && now < turn.landAt,
  );
  const composerText = typing
    ? typing.message.text.slice(
        0,
        Math.floor((now - typing.typeFrom) * TYPE_CPS),
      )
    : "";
  const caretOn = Math.floor(now * 2) % 2 === 0;

  const chatPad = 22 * u;
  const composerH = 60 * u;

  return (
    <div
      style={{
        width,
        height,
        background: backgroundColor ?? palette.page,
        fontFamily,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 60% 60% at ${
            portrait ? 50 : 72
          }% ${portrait ? 72 : 45}%, ${accentColor}${
            build > 0 ? "1E" : "10"
          }, transparent 70%)`,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: stage.x,
          top: stage.y,
          width: stage.w,
          height: stage.h,
        }}
      >
        {/* Thread */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: chat.w,
            height: chat.h,
            borderRadius: 22 * u,
            background: palette.window,
            border: `1px solid ${palette.border}`,
            boxShadow: `inset 0 1px 0 ${palette.highlight}, 0 ${24 * u}px ${
              64 * u
            }px ${palette.shadow}`,
            opacity: panelIn,
            transform: `translateY(${(1 - panelIn) * 18 * u}px)`,
            padding: chatPad,
            paddingBottom: chatPad + composerH + 14 * u,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            gap: 12 * u,
            overflow: "hidden",
          }}
        >
          {turns.map((turn, index) => {
            if (now < turn.landAt) {
              return null;
            }
            const isUser = turn.message.role === "user";
            // A user bubble flies up out of the composer; an assistant bubble
            // opens in place beneath it.
            const land = interpolate(
              now,
              [turn.landAt, turn.landAt + T.send],
              [0, 1],
              { easing: EASING.enter, ...clamp },
            );
            const words = turn.message.text.split(/\s+/);
            const streamed = Math.floor(
              Math.max(now - turn.streamFrom, 0) * STREAM_WPS,
            );
            const thinking = !isUser && now < turn.streamFrom;

            return (
              <div
                key={`${turn.message.role}-${index}`}
                style={{
                  alignSelf: isUser ? "flex-end" : "flex-start",
                  maxWidth: "88%",
                  padding: `${13 * u}px ${17 * u}px`,
                  borderRadius: 16 * u,
                  borderBottomRightRadius: isUser ? 5 * u : 16 * u,
                  borderBottomLeftRadius: isUser ? 16 * u : 5 * u,
                  background: isUser ? palette.band : `${accentColor}1A`,
                  border: `1px solid ${
                    isUser ? palette.border : `${accentColor}44`
                  }`,
                  color: palette.fg,
                  fontSize: 23 * u,
                  lineHeight: 1.36,
                  opacity: land,
                  transform: `translateY(${
                    (1 - land) * (isUser ? 46 * u : 12 * u)
                  }px) scale(${interpolate(land, [0, 1], [0.96, 1], { output: "perceptual-scale" })})`,
                }}
              >
                {thinking ? (
                  <span style={{ display: "flex", gap: 6 * u, padding: 4 * u }}>
                    {[0, 1, 2].map((dot) => (
                      <span
                        key={dot}
                        style={{
                          width: 8 * u,
                          height: 8 * u,
                          borderRadius: "50%",
                          background: accentColor,
                          opacity: interpolate(
                            Math.sin((now * 6 - dot * 0.6) * Math.PI),
                            [-1, 1],
                            [0.25, 1],
                          ),
                        }}
                      />
                    ))}
                  </span>
                ) : (
                  words
                    .slice(0, isUser ? words.length : Math.max(streamed, 1))
                    .join(" ")
                )}
              </div>
            );
          })}

          {/* Composer */}
          <div
            style={{
              position: "absolute",
              left: chatPad,
              right: chatPad,
              bottom: chatPad,
              height: composerH,
              borderRadius: 14 * u,
              background: palette.band,
              border: `1px solid ${
                composerText ? `${accentColor}55` : palette.border
              }`,
              display: "flex",
              alignItems: "center",
              paddingLeft: 16 * u,
              paddingRight: 10 * u,
              gap: 10 * u,
              color: composerText ? palette.fg : palette.faint,
              fontSize: 22 * u,
              overflow: "hidden",
            }}
          >
            <span style={{ whiteSpace: "nowrap" }}>
              {composerText || placeholder}
              {typing ? (
                <span
                  style={{
                    display: "inline-block",
                    width: 2 * u,
                    height: 22 * u,
                    marginLeft: 3 * u,
                    verticalAlign: "-3px",
                    background: accentColor,
                    opacity: caretOn ? 1 : 0.15,
                  }}
                />
              ) : null}
            </span>
            <span
              style={{
                marginLeft: "auto",
                display: "grid",
                placeItems: "center",
                width: 38 * u,
                height: 38 * u,
                borderRadius: 10 * u,
                flexShrink: 0,
                background: composerText ? accentColor : palette.border,
              }}
            >
              <SendGlyph
                size={21 * u}
                color={composerText ? palette.page : palette.faint}
              />
            </span>
          </div>
        </div>

        {/* Preview surface */}
        <div
          style={{
            position: "absolute",
            left: preview.x,
            top: preview.y,
            width: preview.w,
            height: preview.h,
            borderRadius: 22 * u,
            background: palette.window,
            border: `1px solid ${
              build > 0 ? `${accentColor}55` : palette.border
            }`,
            boxShadow: `inset 0 1px 0 ${palette.highlight}, 0 ${24 * u}px ${
              64 * u
            }px ${palette.shadow}`,
            opacity: panelIn,
            transform: `translateY(${(1 - panelIn) * 18 * u}px)`,
            display: "grid",
            gridTemplateRows: previewUrl
              ? `${44 * u}px ${50 * u}px 1fr`
              : `${58 * u}px 1fr`,
            overflow: "hidden",
          }}
        >
          {previewUrl ? (
            <>
              {/* Tab strip */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 12 * u,
                  padding: `0 ${16 * u}px`,
                  background: palette.band,
                  borderBottom: `1px solid ${palette.border}`,
                }}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7 * u,
                    paddingBottom: 13 * u,
                  }}
                >
                  {["#F87171", "#FBBF24", "#34D399"].map((light) => (
                    <span
                      key={light}
                      style={{
                        width: 10 * u,
                        height: 10 * u,
                        borderRadius: "50%",
                        background: light,
                      }}
                    />
                  ))}
                </span>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9 * u,
                    maxWidth: "62%",
                    padding: `${9 * u}px ${16 * u}px`,
                    borderRadius: `${10 * u}px ${10 * u}px 0 0`,
                    background: palette.window,
                    borderTop: `1px solid ${palette.border}`,
                    borderLeft: `1px solid ${palette.border}`,
                    borderRight: `1px solid ${palette.border}`,
                    color: palette.fg,
                    fontSize: 17 * u,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                  }}
                >
                  <span
                    style={{
                      width: 13 * u,
                      height: 13 * u,
                      borderRadius: 4 * u,
                      background: accentColor,
                      flexShrink: 0,
                      opacity: build > 0 ? 1 : 0.4,
                    }}
                  />
                  {previewLabel}
                </span>
              </div>

              {/* URL bar */}
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  gap: 10 * u,
                  padding: `0 ${16 * u}px`,
                  borderBottom: `1px solid ${palette.border}`,
                }}
              >
                <NavArrow size={19 * u} color={palette.dim} />
                <NavArrow size={19 * u} color={palette.faint} flip />
                <span
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 8 * u,
                    minWidth: 0,
                    height: 32 * u,
                    padding: `0 ${14 * u}px`,
                    borderRadius: 999,
                    background: palette.band,
                    border: `1px solid ${palette.border}`,
                    color: build > 0 ? palette.fg : palette.faint,
                    fontSize: 19 * u,
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                  }}
                >
                  <LockGlyph
                    size={16 * u}
                    color={build > 0 ? accentColor : palette.faint}
                  />
                  {previewUrl}
                </span>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7 * u,
                    flexShrink: 0,
                    color: ready > 0 ? accentColor : palette.faint,
                    fontSize: 18 * u,
                    fontWeight: 500,
                  }}
                >
                  {ready > 0 ? (
                    <>
                      <CheckGlyph
                        size={19 * u}
                        color={accentColor}
                        progress={ready}
                      />
                      Ready
                    </>
                  ) : build > 0 ? (
                    <>
                      <Spinner
                        size={19 * u}
                        color={accentColor}
                        turn={now * 1.1}
                      />
                      Loading
                    </>
                  ) : null}
                </span>
                {/* Load bar tied to the build, gone once the page resolves */}
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    bottom: 0,
                    height: 3 * u,
                    width: `${build * 100}%`,
                    background: accentColor,
                    opacity: 1 - resolve,
                  }}
                />
              </div>
            </>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10 * u,
                padding: `0 ${18 * u}px`,
                borderBottom: `1px solid ${palette.border}`,
                color: palette.dim,
                fontSize: 18 * u,
                fontWeight: 600,
              }}
            >
              <span>{previewLabel}</span>
              <span
                style={{
                  marginLeft: "auto",
                  display: "flex",
                  alignItems: "center",
                  gap: 8 * u,
                  color: ready > 0 ? accentColor : palette.faint,
                  fontWeight: 500,
                }}
              >
                {ready > 0 ? (
                  <>
                    <CheckGlyph
                      size={20 * u}
                      color={accentColor}
                      progress={ready}
                    />
                    Ready
                  </>
                ) : build > 0 ? (
                  <>
                    <Spinner
                      size={20 * u}
                      color={accentColor}
                      turn={now * 1.1}
                    />
                    Rendering
                  </>
                ) : (
                  "Idle"
                )}
              </span>
            </div>
          )}

          <div style={{ position: "relative", overflow: "hidden" }}>
            {/* Wireframe the scene is assembled from */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                padding: 30 * u,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: 14 * u,
                opacity: 1 - resolve,
              }}
            >
              {[0.5, 1, 0.72, 0.55].map((share, index) => {
                const block = interpolate(
                  build,
                  [index * 0.2, index * 0.2 + 0.34],
                  [0, 1],
                  clamp,
                );
                const isMedia = index === 1;
                return (
                  <div
                    key={share}
                    style={{
                      width: `${share * 100}%`,
                      height: isMedia ? "38%" : 24 * u,
                      borderRadius: isMedia ? 14 * u : 999,
                      // The media block is tinted so the wireframe reads as a
                      // scene taking shape, not as four grey bars.
                      background: isMedia ? `${accentColor}16` : palette.band,
                      border: `1px solid ${
                        isMedia ? `${accentColor}3A` : palette.border
                      }`,
                      boxShadow: `inset 0 1px 0 ${palette.highlight}`,
                      opacity: block,
                      transform: `scaleX(${interpolate(
                        block,
                        [0, 1],
                        [0.7, 1],
                      )})`,
                    }}
                  />
                );
              })}
            </div>

            {/* The rendered result */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 14 * u,
                padding: 30 * u,
                textAlign: "center",
                background: `radial-gradient(ellipse 70% 60% at 50% 38%, ${accentColor}26, transparent 70%)`,
                opacity: resolve,
                transform: `scale(${interpolate(resolve, [0, 1], [1.03, 1], { output: "perceptual-scale" })})`,
              }}
            >
              <div
                style={{
                  color: palette.fg,
                  fontSize: 52 * u,
                  fontWeight: 700,
                  lineHeight: 1.05,
                  letterSpacing: "-0.02em",
                }}
              >
                {previewTitle}
              </div>
              <div style={{ color: palette.dim, fontSize: 22 * u }}>
                {previewCaption}
              </div>
            </div>

            {/* One sheen across the surface as it resolves */}
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                width: preview.w * 0.4,
                left: interpolate(
                  resolve,
                  [0, 1],
                  [-preview.w * 0.4, preview.w],
                ),
                background: `linear-gradient(90deg, transparent, ${accentColor}22, transparent)`,
                opacity: resolve > 0 && resolve < 1 ? 1 : 0,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
