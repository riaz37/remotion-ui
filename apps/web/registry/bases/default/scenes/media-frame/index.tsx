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

export type MediaFrameProps = {
  src: string;
  /** Headline above the frame. */
  title?: string;
  /** Supporting line under the frame. */
  caption?: string;
  /** Small label above the title — chapter, source, timestamp. */
  eyebrow?: string;
  fit?: MediaFit;
  /**
   * Aspect the frame itself is cut to. The frame is sized to this and centred,
   * so `contain` media fills it instead of sitting in a letterbox.
   */
  aspect?: number;
  /** Corner radius in composition pixels. Defaults to a scaled 20. */
  radius?: number;
  backgroundColor?: string;
  accentColor?: string;
  theme?: "dark" | "light";
  /**
   * Seconds the presented media holds before it retreats. Omit to leave it up
   * for the rest of the scene — inside a `TransitionSeries` the transition
   * should cover the tail rather than the frame fading under it.
   */
  holdSeconds?: number;
  /** Animation speed multiplier. */
  speed?: number;
};

/** Beat plan in seconds. */
const T = {
  /** Shutter opening on the media. */
  open: 0,
  openTo: 0.62,
  eyebrow: 0.24,
  title: 0.34,
  caption: 0.58,
  /** The slow push runs the whole scene. */
  push: 6,
  /** Length of the retreat once `holdSeconds` is up. */
  exitFor: 0.42,
} as const;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/**
 * One piece of media actually presented: the frame opens on it like a shutter
 * while a slow push runs underneath, then the title masks up from the frame's
 * edge and the caption settles beneath — rather than three elements fading in
 * over a static box.
 */
export const MediaFrame: React.FC<MediaFrameProps> = ({
  src,
  title,
  caption,
  eyebrow,
  fit = "contain",
  aspect = 16 / 9,
  radius,
  backgroundColor,
  accentColor = "#E8B86D",
  theme = "dark",
  holdSeconds,
  speed = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const palette = CODE_THEMES[theme];
  const safe = getSafeAreaPadding({ width, height });

  const at = (seconds: number) => (seconds * fps) / speed;
  const ease = (from: number, to: number, easing = EASING.enter) =>
    interpolate(frame, [at(from), at(to)], [0, 1], { easing, ...clamp });

  const stage = {
    w: width - safe.paddingLeft - safe.paddingRight,
    h: height - safe.paddingTop - safe.paddingBottom,
  };
  const u = Math.min(stage.w / 1120, stage.h / 620);

  const open = ease(T.open, T.openTo, EASING.editorial);
  const eyebrowIn = eyebrow ? ease(T.eyebrow, T.eyebrow + 0.4) : 0;
  const titleIn = title ? ease(T.title, T.title + 0.45) : 0;
  const captionIn = caption ? ease(T.caption, T.caption + 0.45) : 0;
  /** Slow push under the frame — the reason the shot feels alive on a hold. */
  const push = ease(0, T.push, EASING.editorial);

  // Exits accelerate away; entrances decelerate in. Never ease-out an exit.
  const exit =
    holdSeconds === undefined
      ? 0
      : interpolate(
          frame,
          [at(holdSeconds), at(holdSeconds + T.exitFor)],
          [0, 1],
          { easing: EASING.exit, ...clamp },
        );

  // Reserve only what is shown: with no title and no caption the frame owns
  // the whole safe area rather than sitting above an empty band.
  const titleSize = 46 * u;
  const eyebrowBlock = eyebrow ? 34 * u : 0;
  const titleBlock = title ? titleSize * 1.1 + 18 * u : 0;
  const captionBlock = caption ? 30 * u + 18 * u : 0;
  const headerH = eyebrowBlock + titleBlock;

  const availableH = stage.h - headerH - captionBlock;
  const frameW = Math.min(stage.w, availableH * aspect);
  const frameH = frameW / aspect;
  const cornerRadius = radius ?? 20 * u;

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
          background: `radial-gradient(ellipse 70% 55% at 50% 45%, ${accentColor}12, transparent 72%)`,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: safe.paddingLeft,
          top: safe.paddingTop,
          width: stage.w,
          height: stage.h,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          opacity: 1 - exit,
          translate: `0 ${exit * -26 * u}px`,
        }}
      >
        {eyebrow ? (
          <div
            style={{
              width: frameW,
              color: accentColor,
              fontSize: 20 * u,
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              height: eyebrowBlock,
              opacity: eyebrowIn,
              translate: `0 ${(1 - eyebrowIn) * 8 * u}px`,
            }}
          >
            {eyebrow}
          </div>
        ) : null}

        {title ? (
          // Masked so the headline rises out of its own line rather than fading.
          <div
            style={{
              width: frameW,
              height: titleBlock,
              overflow: "hidden",
              display: "flex",
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                color: palette.fg,
                fontSize: titleSize,
                fontWeight: 700,
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                translate: `0 ${(1 - titleIn) * titleSize}px`,
              }}
            >
              {title}
            </div>
          </div>
        ) : null}

        <div
          style={{
            width: frameW,
            height: frameH,
            borderRadius: cornerRadius,
            overflow: "hidden",
            position: "relative",
            background: palette.window,
            border: `1px solid ${palette.border}`,
            boxShadow: `inset 0 1px 0 ${palette.highlight}, 0 ${
              26 * u
            }px ${74 * u}px ${palette.shadow}`,
            // Shutter: the frame opens from its centre line outwards.
            clipPath: `inset(${(1 - open) * 50}% 0% ${(1 - open) * 50}% 0% round ${cornerRadius}px)`,
            scale: `${interpolate(open, [0, 1], [0.985, 1])}`,
          }}
        >
          {isVideoSource(src) ? (
            <Video
              src={src}
              muted
              loop
              style={{
                ...getMediaObjectFitStyle(fit),
                scale: `${interpolate(push, [0, 1], [1.06, 1])}`,
              }}
            />
          ) : (
            <Img
              src={src}
              style={{
                ...getMediaObjectFitStyle(fit),
                scale: `${interpolate(push, [0, 1], [1.06, 1])}`,
              }}
            />
          )}
          {/* Grade: a rim of light along the top, weight along the bottom */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(180deg, ${accentColor}12, transparent 26%, transparent 72%, ${palette.shadow})`,
              opacity: open,
            }}
          />
        </div>

        {caption ? (
          <div
            style={{
              width: frameW,
              height: captionBlock,
              display: "flex",
              alignItems: "flex-end",
              color: palette.dim,
              fontSize: 24 * u,
              fontWeight: 500,
              opacity: captionIn,
              translate: `0 ${(1 - captionIn) * 10 * u}px`,
            }}
          >
            {caption}
          </div>
        ) : null}
      </div>
    </div>
  );
};
