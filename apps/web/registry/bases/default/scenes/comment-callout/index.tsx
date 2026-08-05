import { loadFont } from "@remotion/google-fonts/Inter";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { stageScale } from "@/remotion/lib/ai-composer-utils";
import { CODE_THEMES } from "@/remotion/lib/code-syntax";
import { EASING } from "@/remotion/lib/motion-tokens";
import { markEmphasis, markerEdges } from "@/remotion/lib/text-emphasis";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

/** Reference stage the card is laid out against, then uniformly scaled. */
const REF_WIDTH = 1280;
const REF_HEIGHT = 720;

const CARD_WIDTH = 840;
const AVATAR = 68;
const BODY_SIZE = 40;
const BODY_LINE = 1.2;

/** Characters per second the reply is typed at. */
const REPLY_CPS = 34;

export type CommentCalloutProps = {
  /** The viewer comment being answered. */
  body?: string;
  /** Display name of the commenter. */
  author?: string;
  /** Social handle, also used on the reply line. */
  handle?: string;
  /** Avatar initials. Falls back to the first two letters of `author`. */
  initials?: string;
  /** Relative time shown next to the handle, e.g. "2h". */
  timestamp?: string;
  /**
   * Substring of `body` to mark up as the creator emphasises the ask.
   * Matched case-insensitively; omit to skip the highlight beat.
   */
  highlight?: string;
  /** The answer typed back. Omit to end the scene on the comment itself. */
  reply?: string;
  /** Label above the composer. */
  replyLabel?: string;
  /** Like count before the creator hearts the comment. */
  likes?: number;
  accentColor?: string;
  /** Overrides the page background behind the card. */
  backgroundColor?: string;
  theme?: "dark" | "light";
  /** Animation speed multiplier. */
  speed?: number;
};

/** Drawn, not typed — emoji render inconsistently across platforms. */
const Heart: React.FC<{ size: number; color: string; fill: number }> = ({
  size,
  color,
  fill,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M12 20.2s-7.4-4.6-7.4-9.6a4.2 4.2 0 0 1 7.4-2.7 4.2 4.2 0 0 1 7.4 2.7c0 5-7.4 9.6-7.4 9.6Z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinejoin="round"
      fill={color}
      fillOpacity={fill}
    />
  </svg>
);

const Reply: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M9.5 6.5 4 12l5.5 5.5M4.4 12H14a5.5 5.5 0 0 1 5.5 5.5v1"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const Send: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M4 11.6 20 4l-7.6 16-2.1-6.3L4 11.6Z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinejoin="round"
    />
  </svg>
);

const Check: React.FC<{ size: number; color: string; progress: number }> = ({
  size,
  color,
  progress,
}) => {
  const length = 22;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M4.5 12.5l5 5 10-11"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={length}
        strokeDashoffset={length * (1 - progress)}
      />
    </svg>
  );
};

/** Word gap in the comment body, also bridged by the marker. */
const WORD_GAP = "0.3em";

/**
 * A viewer comment staged the way a creator actually uses one: it arrives from
 * the feed, the ask gets marked up, the creator hearts it, and the answer is
 * typed back and sent — rather than a quote card fading into place.
 */
export const CommentCallout: React.FC<CommentCalloutProps> = ({
  body = "Can you break down how you built that transition?",
  author = "Alex Chen",
  handle = "@alexchen",
  initials,
  timestamp = "2h",
  highlight = "how you built that transition",
  reply = "Full breakdown drops Thursday — here's the short version.",
  replyLabel,
  likes = 128,
  accentColor = "#F472B6",
  backgroundColor,
  theme = "dark",
  speed = 1,
}) => {
  const rawFrame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const palette = CODE_THEMES[theme];
  const page = backgroundColor ?? palette.page;
  const scale = stageScale(width, height, REF_WIDTH, REF_HEIGHT);
  const frame = rawFrame * speed;

  const seconds = (value: number) => value * fps;
  const clamp = {
    extrapolateLeft: "clamp" as const,
    extrapolateRight: "clamp" as const,
  };

  const words = markEmphasis(body, highlight);
  const markedCount = words.filter((word) => word.marked).length;
  const avatarText =
    initials ?? (author ? author.slice(0, 2).toUpperCase() : "??");

  // --- Beat plan ----------------------------------------------------------
  const markStart = seconds(0.85);
  const markStep = seconds(0.09);
  const markEnd = markStart + Math.max(markedCount - 1, 0) * markStep + seconds(0.34);
  const heartAt = markedCount > 0 ? markEnd + seconds(0.14) : seconds(1.0);
  const composerAt = heartAt + seconds(0.34);
  const typeStart = composerAt + seconds(0.3);
  const typeEnd = typeStart + (reply.length / REPLY_CPS) * fps;
  const sendAt = typeEnd + seconds(0.3);

  const cardEnter = spring({
    fps,
    frame,
    config: { damping: 17, stiffness: 125, mass: 0.85 },
  });
  const identityIn = interpolate(
    frame,
    [seconds(0.14), seconds(0.5)],
    [0, 1],
    { easing: EASING.enter, ...clamp },
  );
  const bodyIn = interpolate(frame, [seconds(0.26), seconds(0.66)], [0, 1], {
    easing: EASING.enter,
    ...clamp,
  });

  const hearted = interpolate(
    frame,
    [heartAt, heartAt + seconds(0.26)],
    [0, 1],
    { easing: EASING.enter, ...clamp },
  );
  // The count flips at the moment the heart fills, and rises as it flips.
  const countFlip = interpolate(
    frame,
    [heartAt + seconds(0.08), heartAt + seconds(0.3)],
    [0, 1],
    { easing: EASING.enter, ...clamp },
  );

  const hasReply = reply.length > 0;
  const composerOpen = hasReply
    ? interpolate(frame, [composerAt, composerAt + seconds(0.32)], [0, 1], {
        easing: EASING.enter,
        ...clamp,
      })
    : 0;
  const typed = hasReply
    ? Math.round(interpolate(frame, [typeStart, typeEnd], [0, reply.length], clamp))
    : 0;
  const sent = hasReply
    ? interpolate(frame, [sendAt, sendAt + seconds(0.3)], [0, 1], {
        easing: EASING.enter,
        ...clamp,
      })
    : 0;
  // Press dip on the send control, right as the reply commits.
  const press = hasReply
    ? interpolate(
        frame,
        [sendAt - seconds(0.06), sendAt, sendAt + seconds(0.16)],
        [0, 1, 0],
        clamp,
      )
    : 0;
  const caretOn =
    hasReply &&
    frame > composerAt + seconds(0.18) &&
    sent < 0.5 &&
    (frame < typeStart || typed >= reply.length
      ? Math.floor(frame / (fps * 0.4)) % 2 === 0
      : true);

  const composerHeight = 118;

  return (
    <div
      style={{
        width,
        height,
        background: page,
        fontFamily,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 65% 55% at 50% 40%, ${accentColor}1F, transparent 70%)`,
          opacity: bodyIn,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            theme === "dark"
              ? "radial-gradient(ellipse 120% 90% at 50% 50%, transparent 45%, rgba(0,0,0,0.55) 100%)"
              : "radial-gradient(ellipse 120% 90% at 50% 50%, transparent 55%, rgba(15,18,25,0.07) 100%)",
        }}
      />

      <div
        style={{
          width: CARD_WIDTH,
          transform: `scale(${scale * interpolate(cardEnter, [0, 1], [0.965, 1])}) translateY(${interpolate(cardEnter, [0, 1], [42, 0])}px)`,
          opacity: cardEnter,
          borderRadius: 22,
          background: palette.window,
          border: `1px solid ${palette.border}`,
          boxShadow: `inset 0 1px 0 ${palette.highlight}, 0 34px 90px ${palette.shadow}`,
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "30px 34px 24px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              opacity: identityIn,
              transform: `translateY(${(1 - identityIn) * 8}px)`,
            }}
          >
            <div
              style={{
                width: AVATAR,
                height: AVATAR,
                flexShrink: 0,
                borderRadius: "50%",
                background: accentColor,
                color: palette.page,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 25,
                fontWeight: 700,
                letterSpacing: 0.5,
              }}
            >
              {avatarText}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <span
                style={{ color: palette.fg, fontSize: 27, fontWeight: 600 }}
              >
                {author}
              </span>
              <span style={{ color: palette.dim, fontSize: 22 }}>{handle}</span>
              {timestamp ? (
                <span style={{ color: palette.faint, fontSize: 22 }}>
                  · {timestamp}
                </span>
              ) : null}
            </div>
          </div>

          <p
            style={{
              margin: "22px 0 0",
              paddingLeft: AVATAR + 16,
              color: palette.fg,
              fontSize: BODY_SIZE,
              lineHeight: BODY_LINE,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              opacity: bodyIn,
              transform: `translateY(${(1 - bodyIn) * 10}px)`,
            }}
          >
            {words.map((word, index) => {
              // Marker sweeps word by word, so it tracks a wrapped phrase.
              const mark = word.marked
                ? interpolate(
                    frame,
                    [
                      markStart + word.order * markStep,
                      markStart + word.order * markStep + seconds(0.34),
                    ],
                    [0, 1],
                    { easing: EASING.enter, ...clamp },
                  )
                : 0;

              return (
                <span
                  key={`${word.text}-${index}`}
                  style={{
                    position: "relative",
                    display: "inline-block",
                    marginRight: WORD_GAP,
                  }}
                >
                  {word.marked ? (
                    <span
                      style={{
                        position: "absolute",
                        ...markerEdges(words, index, WORD_GAP),
                        top: "16%",
                        bottom: "2%",
                        background: `${accentColor}42`,
                        transform: `scaleX(${mark})`,
                        transformOrigin: "left center",
                      }}
                    />
                  ) : null}
                  <span style={{ position: "relative" }}>{word.text}</span>
                </span>
              );
            })}
          </p>

          <div
            style={{
              marginTop: 24,
              paddingLeft: AVATAR + 16,
              display: "flex",
              alignItems: "center",
              gap: 26,
              opacity: identityIn,
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 9,
                color: hearted > 0.5 ? accentColor : palette.faint,
                fontSize: 22,
                fontWeight: 500,
                transform: `scale(${1 + Math.sin(Math.PI * hearted) * 0.09})`,
                transformOrigin: "left center",
              }}
            >
              <Heart
                size={24}
                color={hearted > 0.5 ? accentColor : palette.faint}
                fill={hearted}
              />
              <span
                style={{
                  display: "inline-block",
                  transform: `translateY(${-countFlip * 2}px)`,
                }}
              >
                {likes + (countFlip > 0.5 ? 1 : 0)}
              </span>
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 9,
                color: composerOpen > 0.2 ? accentColor : palette.faint,
                fontSize: 22,
                fontWeight: 500,
              }}
            >
              <Reply
                size={24}
                color={composerOpen > 0.2 ? accentColor : palette.faint}
              />
              {replyLabel ?? "Reply"}
            </span>
          </div>
        </div>

        {hasReply ? (
          <div
            style={{
              height: composerHeight * composerOpen,
              overflow: "hidden",
              borderTop: `1px solid ${palette.border}`,
              background: `${accentColor}${sent > 0.5 ? "14" : "0A"}`,
            }}
          >
            <div
              style={{
                padding: "18px 34px 20px",
                display: "flex",
                alignItems: "center",
                gap: 16,
                // Slides up out of the fold rather than stretching the type.
                transform: `translateY(${(composerOpen - 1) * 12}px)`,
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    color: palette.faint,
                    fontSize: 17,
                    fontWeight: 500,
                    letterSpacing: 0.3,
                    marginBottom: 6,
                  }}
                >
                  Replying to {handle}
                </div>
                <div
                  style={{
                    color: sent > 0.4 ? palette.fg : palette.dim,
                    fontSize: 25,
                    fontWeight: 500,
                    lineHeight: 1.25,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {reply.slice(0, typed)}
                  {caretOn ? (
                    <span
                      style={{
                        display: "inline-block",
                        width: 2,
                        height: "1.05em",
                        marginLeft: 2,
                        verticalAlign: "-0.16em",
                        background: accentColor,
                      }}
                    />
                  ) : null}
                </div>
              </div>
              <div
                style={{
                  width: 46,
                  height: 46,
                  flexShrink: 0,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background:
                    sent > 0.5 || typed >= reply.length
                      ? accentColor
                      : `${accentColor}26`,
                  transform: `scale(${1 - press * 0.12})`,
                }}
              >
                {sent > 0.02 ? (
                  <Check size={22} color={palette.page} progress={sent} />
                ) : (
                  <Send
                    size={21}
                    color={typed >= reply.length ? palette.page : accentColor}
                  />
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
