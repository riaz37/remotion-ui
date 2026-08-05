import { loadFont } from "@remotion/google-fonts/Inter";
import { Video } from "@remotion/media";
import { Img, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { CODE_THEMES } from "@/remotion/lib/code-syntax";
import { getSafeAreaPadding } from "@/remotion/lib/layout";
import { EASING } from "@/remotion/lib/motion-tokens";
import {
  getMediaObjectFitStyle,
  isVideoSource,
  type MediaFit,
} from "@/remotion/lib/media-utils";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export type BRollItem = {
  src: string;
  /** Label on the card while it is at the front. */
  title?: string;
  /** Second line under the label. */
  caption?: string;
  fit?: MediaFit;
  backgroundColor?: string;
};

export type BRollStackProps = {
  items?: BRollItem[];
  /** Headline beside the deck. */
  title?: string;
  /** Small label above the headline. */
  kicker?: string;
  /** Supporting line under the headline. */
  caption?: string;
  /** Seconds each shot holds at the front before the deck advances. */
  holdSeconds?: number;
  /** Aspect the cards are cut to. */
  aspect?: number;
  backgroundColor?: string;
  accentColor?: string;
  theme?: "dark" | "light";
  /** Animation speed multiplier. */
  speed?: number;
};

/** Beat plan in seconds. */
const T = {
  header: 0,
  /** Deck lands after the headline. */
  deck: 0.28,
  /** First advance, measured from the deck landing. */
  firstHold: 1.35,
  /** Time one card takes to ride to the front. */
  advance: 0.55,
} as const;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/** How a card sits at a given depth in the deck — 0 is the front. */
const placement = (depth: number, u: number) => ({
  x: depth * 34 * u,
  y: depth * -22 * u,
  scale: 1 - depth * 0.07,
  rotate: depth * 1.6,
});

/**
 * A deck of supporting shots being dealt rather than three cards fanned out and
 * held: each shot rides to the front in turn with its own label, the one it
 * replaces slides back into the stack, and the deck keeps cycling for as long
 * as the scene runs.
 */
export const BRollStack: React.FC<BRollStackProps> = ({
  items = [],
  title,
  kicker,
  caption,
  holdSeconds = 1.35,
  aspect = 16 / 9,
  backgroundColor,
  accentColor = "#E8B86D",
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
  // The reference stage turns with the composition — sizing a 9:16 frame off a
  // landscape reference leaves the headline tiny.
  const u = portrait
    ? Math.min(stage.w / 620, stage.h / 1120)
    : Math.min(stage.w / 1120, stage.h / 620);
  const count = items.length;

  const headerIn = ease(T.header, T.header + 0.5);
  const deckIn = ease(T.deck, T.deck + 0.55, EASING.editorial);

  // Continuous front index: it holds on whole numbers and eases between them,
  // so every card can be placed from this one number instead of per-card state.
  const cycle = holdSeconds + T.advance;
  const elapsed = Math.max(now - (T.deck + T.firstHold - holdSeconds), 0);
  const step = Math.floor(elapsed / cycle);
  const advance = interpolate(
    elapsed - step * cycle,
    [holdSeconds, cycle],
    [0, 1],
    { easing: EASING.editorial, ...clamp },
  );
  const front = count > 0 ? step + advance : 0;

  const headerW = portrait ? stage.w : stage.w * 0.36;
  const deckBox = portrait
    ? { x: 0, y: stage.h * 0.24, w: stage.w, h: stage.h * 0.5 }
    : { x: headerW + 40 * u, y: 0, w: stage.w - headerW - 40 * u, h: stage.h };
  // Room is left for the deepest visible card to sit up and to the right.
  const cardW = Math.min(deckBox.w - 76 * u, (deckBox.h - 70 * u) * aspect);
  const cardH = cardW / aspect;
  const cardX = deckBox.x + (deckBox.w - cardW) / 2 - 34 * u;
  const cardY = deckBox.y + (deckBox.h - cardH) / 2 + (portrait ? 0 : 22 * u);

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
          background: `radial-gradient(ellipse 60% 55% at ${
            portrait ? 50 : 70
          }% 45%, ${accentColor}14, transparent 72%)`,
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
        <div
          style={{
            position: "absolute",
            left: 0,
            top: portrait ? 0 : "50%",
            width: headerW,
            transform: portrait ? undefined : "translateY(-50%)",
            display: "flex",
            flexDirection: "column",
            gap: 12 * u,
          }}
        >
          {kicker ? (
            <div
              style={{
                color: accentColor,
                fontSize: 20 * u,
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                opacity: headerIn,
                transform: `translateY(${(1 - headerIn) * 10 * u}px)`,
              }}
            >
              {kicker}
            </div>
          ) : null}
          {title ? (
            <div
              style={{
                color: palette.fg,
                fontSize: 50 * u,
                fontWeight: 700,
                lineHeight: 1.08,
                letterSpacing: "-0.02em",
                opacity: headerIn,
                transform: `translateY(${(1 - headerIn) * 16 * u}px)`,
              }}
            >
              {title}
            </div>
          ) : null}
          {caption ? (
            <div
              style={{
                color: palette.dim,
                fontSize: 23 * u,
                lineHeight: 1.4,
                opacity: ease(T.header + 0.18, T.header + 0.62),
              }}
            >
              {caption}
            </div>
          ) : null}
          {count > 1 ? (
            <div
              style={{
                marginTop: 6 * u,
                color: palette.faint,
                fontSize: 20 * u,
                fontVariantNumeric: "tabular-nums",
                opacity: deckIn,
              }}
            >
              {String((Math.round(front) % count) + 1).padStart(2, "0")} /{" "}
              {String(count).padStart(2, "0")}
            </div>
          ) : null}
        </div>

        {items.map((item, index) => {
          // Depth in the deck, wrapping so the card that just left the front
          // reappears at the back rather than travelling across the frame.
          const depth =
            count > 0 ? (((index - front) % count) + count) % count : 0;
          if (depth > 2.6) {
            return null;
          }
          const spot = placement(depth, u);
          const isFront = depth < 0.5;
          // The deepest card fades in as it takes its place, so the wrap is
          // never seen.
          const fade = interpolate(depth, [2, 2.6], [1, 0], clamp);

          return (
            <div
              key={`${item.src}-${index}`}
              style={{
                position: "absolute",
                left: cardX,
                top: cardY,
                width: cardW,
                height: cardH,
                borderRadius: 20 * u,
                overflow: "hidden",
                background: item.backgroundColor ?? palette.window,
                border: `1px solid ${
                  isFront ? `${accentColor}66` : palette.border
                }`,
                boxShadow: `0 ${(14 + (2 - depth) * 12) * u}px ${
                  (40 + (2 - depth) * 26) * u
                }px ${palette.shadow}`,
                opacity: deckIn * fade,
                transform: `translate(${spot.x}px, ${
                  spot.y + (1 - deckIn) * 40 * u
                }px) scale(${spot.scale}) rotate(${spot.rotate}deg)`,
                zIndex: Math.round(100 - depth * 10),
              }}
            >
              {isVideoSource(item.src) ? (
                <Video
                  src={item.src}
                  muted
                  loop
                  style={getMediaObjectFitStyle(item.fit ?? "cover")}
                />
              ) : (
                <Img
                  src={item.src}
                  style={getMediaObjectFitStyle(item.fit ?? "cover")}
                />
              )}

              {/* Cards behind the front one are pushed down so the front card
                  keeps the eye */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: palette.page,
                  opacity: interpolate(depth, [0, 1], [0, 0.45], clamp),
                }}
              />

              {item.title || item.caption ? (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    paddingTop: 64 * u,
                    paddingLeft: 22 * u,
                    paddingRight: 22 * u,
                    paddingBottom: 18 * u,
                    // Tall enough to sit the label on its own band — a short
                    // scrim leaves it fighting whatever the shot has at its foot.
                    background: `linear-gradient(180deg, transparent, ${palette.page}CC 44%, ${palette.page}F5)`,
                    opacity: interpolate(depth, [0, 0.6], [1, 0], clamp),
                  }}
                >
                  {item.title ? (
                    <div
                      style={{
                        color: "#F5F6F8",
                        fontSize: 26 * u,
                        fontWeight: 600,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {item.title}
                    </div>
                  ) : null}
                  {item.caption ? (
                    <div
                      style={{
                        marginTop: 4 * u,
                        color: accentColor,
                        fontSize: 19 * u,
                        fontWeight: 500,
                      }}
                    >
                      {item.caption}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};
