import { loadFont } from "@remotion/google-fonts/Inter";
import { Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CODE_THEMES } from "@/remotion/lib/code-syntax";
import { clampRectToSafeArea, getSafeAreaPadding } from "@/remotion/lib/layout";
import { EASING } from "@/remotion/lib/motion-tokens";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export type SpotlightTarget = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CalloutSpotlightProps = {
  title: string;
  subtitle?: string;
  /** Small label above the title. */
  kicker?: string;
  /** Region to spotlight, in source pixels. */
  target: SpotlightTarget;
  /** Screenshot or capture under the spotlight. */
  backgroundSrc?: string;
  /** Size the target was measured against. Defaults to the composition. */
  sourceWidth?: number;
  sourceHeight?: number;
  /** How far the rest of the frame is knocked back, 0–1. */
  dim?: number;
  backgroundColor?: string;
  accentColor?: string;
  theme?: "dark" | "light";
  /** Animation speed multiplier. */
  speed?: number;
};

/** Beat plan in seconds. */
const T = {
  background: 0,
  /** The mask closes in from the whole frame onto the target. */
  iris: 0.3,
  irisFor: 0.7,
  ping: 1.0,
  pingFor: 0.9,
  connector: 1.05,
  card: 1.2,
  kicker: 1.3,
  title: 1.4,
  subtitle: 1.6,
} as const;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/**
 * A spotlight that is aimed rather than drawn: the frame dims and the mask
 * closes in from the whole picture onto the target, a ring pings the region
 * once it lands, and only then does a connector draw out to the callout — so
 * the eye is taken to the thing before it is told about it.
 */
export const CalloutSpotlight: React.FC<CalloutSpotlightProps> = ({
  title,
  subtitle,
  kicker,
  target,
  backgroundSrc,
  sourceWidth,
  sourceHeight,
  dim = 0.72,
  backgroundColor,
  accentColor = "#E8B86D",
  theme = "dark",
  speed = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const palette = CODE_THEMES[theme];
  const safe = getSafeAreaPadding({ width, height });

  const at = (seconds: number) => (seconds * fps) / speed;
  const ease = (from: number, to: number, easing = EASING.enter) =>
    interpolate(frame, [at(from), at(to)], [0, 1], { easing, ...clamp });

  const portrait = height > width;
  const u = portrait
    ? Math.min(width / 620, height / 1120)
    : Math.min(width / 1280, height / 720);

  // The target is authored against whatever the capture was measured at, so it
  // is mapped into the composition before anything else uses it — through the
  // same `object-fit: cover` transform the background image gets, otherwise the
  // spotlight lands next to the thing it is meant to be aiming at whenever the
  // capture and the composition disagree on aspect.
  const sw = sourceWidth ?? width;
  const sh = sourceHeight ?? height;
  const scale = Math.max(width / sw, height / sh);
  const offsetX = (width - sw * scale) / 2;
  const offsetY = (height - sh * scale) / 2;
  const rect = clampRectToSafeArea(
    {
      x: offsetX + target.x * scale,
      y: offsetY + target.y * scale,
      width: target.width * scale,
      height: target.height * scale,
    },
    width,
    height,
  );

  const backgroundIn = ease(T.background, T.background + 0.6, EASING.editorial);
  const iris = ease(T.iris, T.iris + T.irisFor, EASING.editorial);
  const ping = ease(T.ping, T.ping + T.pingFor, EASING.editorial);
  const connector = ease(T.connector, T.connector + 0.45, EASING.editorial);
  const card = spring({
    frame: frame - at(T.card),
    fps,
    config: { damping: 16, stiffness: 150, mass: 0.7 },
  });
  const kickerIn = kicker ? ease(T.kicker, T.kicker + 0.4) : 0;
  const titleIn = ease(T.title, T.title + 0.45);
  const subtitleIn = subtitle ? ease(T.subtitle, T.subtitle + 0.45) : 0;

  // The hole starts as the whole frame and closes onto the target.
  const hole = {
    x: interpolate(iris, [0, 1], [0, rect.x]),
    y: interpolate(iris, [0, 1], [0, rect.y]),
    width: interpolate(iris, [0, 1], [width, rect.width]),
    height: interpolate(iris, [0, 1], [height, rect.height]),
  };

  // The callout sits under the target when there is room, otherwise above it.
  // When it sits above, it is anchored by its foot rather than its head, so no
  // guess at the card's height is needed anywhere.
  const cardW = Math.min(width - safe.paddingLeft - safe.paddingRight, 470 * u);
  const gap = 46 * u;
  const cardBelow =
    height - (rect.y + rect.height) > safe.paddingBottom + 210 * u;
  const cardX = Math.min(
    Math.max(rect.x + rect.width / 2 - cardW / 2, safe.paddingLeft),
    width - safe.paddingRight - cardW,
  );
  /** The connector spans the gap next to the target, whatever the card's size. */
  const connectorTop = cardBelow ? rect.y + rect.height : rect.y - gap;
  const connectorX = Math.min(
    Math.max(rect.x + rect.width / 2, cardX + 34 * u),
    cardX + cardW - 34 * u,
  );

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
      {backgroundSrc ? (
        <Img
          src={backgroundSrc}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${interpolate(backgroundIn, [0, 1], [1.04, 1])})`,
          }}
        />
      ) : null}

      {/* Everything outside the hole is knocked back by one huge shadow */}
      <div
        style={{
          position: "absolute",
          left: hole.x,
          top: hole.y,
          width: hole.width,
          height: hole.height,
          borderRadius: 14 * u * iris,
          boxShadow: `0 0 0 ${Math.max(width, height)}px rgba(4,5,9,${
            dim * iris
          })`,
          border: `${2 * u}px solid ${accentColor}${
            iris > 0.6 ? "CC" : "00"
          }`,
        }}
      />

      {/* Ping — one ring off the target once the mask has landed */}
      <div
        style={{
          position: "absolute",
          left: rect.x,
          top: rect.y,
          width: rect.width,
          height: rect.height,
          borderRadius: 14 * u,
          border: `${2 * u}px solid ${accentColor}`,
          opacity: ping > 0 && ping < 1 ? (1 - ping) * 0.85 : 0,
          transform: `scale(${interpolate(ping, [0, 1], [1, 1.12])})`,
        }}
      />

      {/* Connector from the callout to the region it is about */}
      <div
        style={{
          position: "absolute",
          left: connectorX - 1 * u,
          top: connectorTop,
          width: 2 * u,
          height: gap,
          background: accentColor,
          transformOrigin: cardBelow ? "top center" : "bottom center",
          transform: `scaleY(${connector})`,
          opacity: 0.85,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: connectorX - 5 * u,
          top: (cardBelow ? rect.y + rect.height : rect.y) - 5 * u,
          width: 10 * u,
          height: 10 * u,
          borderRadius: "50%",
          background: accentColor,
          opacity: connector,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: cardX,
          ...(cardBelow
            ? { top: rect.y + rect.height + gap }
            : { bottom: height - (rect.y - gap) }),
          width: cardW,
          borderRadius: 18 * u,
          background: `${palette.window}F2`,
          border: `1px solid ${palette.border}`,
          boxShadow: `inset 0 1px 0 ${palette.highlight}, 0 ${
            22 * u
          }px ${56 * u}px ${palette.shadow}`,
          padding: `${20 * u}px ${24 * u}px`,
          opacity: Math.min(card, 1),
          transform: `translateY(${
            (1 - Math.min(card, 1)) * (cardBelow ? 18 : -18) * u
          }px)`,
        }}
      >
        {kicker ? (
          <div
            style={{
              color: accentColor,
              fontSize: 18 * u,
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              opacity: kickerIn,
            }}
          >
            {kicker}
          </div>
        ) : null}
        <div style={{ overflow: "hidden", marginTop: kicker ? 8 * u : 0 }}>
          <div
            style={{
              color: palette.fg,
              fontSize: 34 * u,
              fontWeight: 700,
              lineHeight: 1.14,
              letterSpacing: "-0.02em",
              transform: `translateY(${(1 - titleIn) * 100}%)`,
            }}
          >
            {title}
          </div>
        </div>
        {subtitle ? (
          <div
            style={{
              marginTop: 8 * u,
              color: palette.dim,
              fontSize: 22 * u,
              lineHeight: 1.35,
              opacity: subtitleIn,
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </div>
    </div>
  );
};
