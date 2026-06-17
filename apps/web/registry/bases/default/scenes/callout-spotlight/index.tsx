import { loadFont } from "@remotion/google-fonts/Inter";
import {
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  clampRectToSafeArea,
  getSafeAreaPadding,
  scaleFont,
  type Rect,
} from "@/remotion/lib/layout";
import { DURATION, EASING, STAGGER } from "@/remotion/lib/motion-tokens";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700", "800"],
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
  kicker?: string;
  target: SpotlightTarget;
  backgroundSrc?: string;
  backgroundColor?: string;
  accentColor?: string;
  sourceWidth?: number;
  sourceHeight?: number;
};

const COLORS = {
  bg: "#080810",
  panel: "#0c0f19",
  panelRaised: "rgba(9, 11, 20, 0.94)",
  text: "#ffffff",
  muted: "#b9bfcc",
  accent: "#e8b86d",
  teal: "#2dd4bf",
} as const;

const DEFAULT_SOURCE = {
  width: 1280,
  height: 720,
} as const;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function fitTextSize({
  text,
  width,
  base,
  min,
}: {
  text: string;
  width: number;
  base: number;
  min: number;
}): number {
  const longestWord = text.split(/\s+/).reduce((longest, word) => {
    return word.length > longest.length ? word : longest;
  }, "");
  const longCopyScale = text.length > 38 ? 0.82 : 1;
  const wordScale = longestWord.length > 15 ? 0.76 : 1;

  return Math.round(
    clamp(base * Math.min(longCopyScale, wordScale), min, base) *
      (width / 1080),
  );
}

function getContainedRect({
  frameWidth,
  frameHeight,
  safe,
  aspectRatio,
  isPortrait,
}: {
  frameWidth: number;
  frameHeight: number;
  safe: ReturnType<typeof getSafeAreaPadding>;
  aspectRatio: number;
  isPortrait: boolean;
}): Rect {
  const availableWidth = frameWidth - safe.paddingLeft - safe.paddingRight;
  const availableHeight =
    frameHeight - safe.paddingTop - safe.paddingBottom - scaleFont(isPortrait ? 24 : 10, frameWidth);
  const preferredWidth = isPortrait ? availableWidth : availableWidth * 0.88;
  const preferredHeight = isPortrait ? availableHeight * 0.58 : availableHeight * 0.78;
  let mediaWidth = preferredWidth;
  let mediaHeight = mediaWidth / aspectRatio;

  if (mediaHeight > preferredHeight) {
    mediaHeight = preferredHeight;
    mediaWidth = mediaHeight * aspectRatio;
  }

  return {
    x: safe.paddingLeft + (availableWidth - mediaWidth) / 2,
    y: safe.paddingTop + (availableHeight - mediaHeight) / 2,
    width: mediaWidth,
    height: mediaHeight,
  };
}

function scaleTargetToSurface({
  target,
  surface,
  sourceWidth,
  sourceHeight,
}: {
  target: SpotlightTarget;
  surface: Rect;
  sourceWidth: number;
  sourceHeight: number;
}): Rect {
  const scaleX = surface.width / sourceWidth;
  const scaleY = surface.height / sourceHeight;

  return {
    x: surface.x + target.x * scaleX,
    y: surface.y + target.y * scaleY,
    width: target.width * scaleX,
    height: target.height * scaleY,
  };
}

function getCalloutRect({
  target,
  safe,
  frameWidth,
  frameHeight,
  isPortrait,
}: {
  target: Rect;
  safe: ReturnType<typeof getSafeAreaPadding>;
  frameWidth: number;
  frameHeight: number;
  isPortrait: boolean;
}): Rect {
  const gap = scaleFont(isPortrait ? 22 : 24, frameWidth);
  const minWidth = scaleFont(isPortrait ? 520 : 320, frameWidth);
  const maxWidth = scaleFont(isPortrait ? 800 : 430, frameWidth);
  const safeLeft = safe.paddingLeft;
  const safeRight = frameWidth - safe.paddingRight;
  const safeTop = safe.paddingTop;
  const safeBottom = frameHeight - safe.paddingBottom;
  const rightSpace = safeRight - (target.x + target.width + gap);
  const leftSpace = target.x - gap - safeLeft;
  const sideWidth = clamp(
    Math.max(rightSpace, leftSpace),
    Math.min(minWidth, safeRight - safeLeft),
    Math.min(maxWidth, safeRight - safeLeft),
  );
  const height = scaleFont(isPortrait ? 230 : 150, frameWidth);

  if (!isPortrait && rightSpace >= minWidth * 0.8) {
    return {
      x: target.x + target.width + gap,
      y: clamp(target.y + target.height * 0.08, safeTop, safeBottom - height),
      width: Math.min(sideWidth, rightSpace),
      height,
    };
  }

  if (!isPortrait && leftSpace >= minWidth * 0.8) {
    const width = Math.min(sideWidth, leftSpace);
    return {
      x: target.x - gap - width,
      y: clamp(target.y + target.height * 0.08, safeTop, safeBottom - height),
      width,
      height,
    };
  }

  const width = Math.min(maxWidth, safeRight - safeLeft);
  const x = safeLeft + (safeRight - safeLeft - width) / 2;
  const belowY = target.y + target.height + gap;
  const aboveY = target.y - gap - height;
  const y =
    belowY + height <= safeBottom
      ? belowY
      : aboveY >= safeTop
        ? aboveY
        : safeBottom - height;

  return { x, y, width, height };
}

function PlaceholderSurface({ accentColor }: { accentColor: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: `radial-gradient(circle at 78% 18%, ${accentColor}44, transparent 28%), linear-gradient(135deg, #1b2030, #0a0d16)`,
        display: "grid",
        gridTemplateRows: "1fr 1fr 1.4fr",
        gap: 18,
        padding: 48,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "46%",
          borderRadius: 999,
          background: "rgba(255,255,255,0.68)",
        }}
      />
      <div
        style={{
          width: "34%",
          borderRadius: 999,
          background: accentColor,
        }}
      />
      <div
        style={{
          borderRadius: 30,
          background: "rgba(2,6,23,0.42)",
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)",
        }}
      />
    </div>
  );
}

export const CalloutSpotlight: React.FC<CalloutSpotlightProps> = ({
  title,
  subtitle,
  kicker = "Focus",
  target,
  backgroundSrc,
  backgroundColor = COLORS.bg,
  accentColor = COLORS.accent,
  sourceWidth = DEFAULT_SOURCE.width,
  sourceHeight = DEFAULT_SOURCE.height,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const safe = getSafeAreaPadding({ width, height });
  const isPortrait = height > width;
  const aspectRatio = sourceWidth / sourceHeight;
  const surface = getContainedRect({
    frameWidth: width,
    frameHeight: height,
    safe,
    aspectRatio,
    isPortrait,
  });
  const scaledTarget = clampRectToSafeArea(
    scaleTargetToSurface({
      target,
      surface,
      sourceWidth,
      sourceHeight,
    }),
    width,
    height,
  );
  const callout = getCalloutRect({
    target: scaledTarget,
    safe,
    frameWidth: width,
    frameHeight: height,
    isPortrait,
  });
  const mediaEnter = spring({
    frame,
    fps,
    config: {
      damping: 18,
      mass: 0.9,
      stiffness: 112,
    },
    durationInFrames: DURATION.normal,
  });
  const ringEnter = interpolate(frame, [STAGGER.tight, DURATION.fast], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASING.enter,
  });
  const calloutEnter = interpolate(
    frame,
    [STAGGER.normal, STAGGER.normal + DURATION.fast],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASING.enter,
    },
  );
  const pulse = interpolate(frame % 72, [0, 36, 72], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASING.editorial,
  });
  const titleSize = fitTextSize({
    text: title,
    width,
    base: isPortrait ? 50 : 38,
    min: isPortrait ? 34 : 28,
  });
  const subtitleSize = scaleFont(isPortrait ? 30 : 24, width);
  const calloutPadding = scaleFont(isPortrait ? 28 : 22, width);

  return (
    <div
      style={{
        width,
        height,
        position: "relative",
        overflow: "hidden",
        background: `radial-gradient(circle at 82% 18%, ${accentColor}24, transparent 30%), radial-gradient(circle at 16% 78%, ${COLORS.teal}16, transparent 34%), ${backgroundColor}`,
        color: COLORS.text,
        fontFamily,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: surface.x,
          top: surface.y,
          width: surface.width,
          height: surface.height,
          borderRadius: scaleFont(isPortrait ? 34 : 28, width),
          overflow: "hidden",
          background: COLORS.panel,
          boxShadow: `0 ${scaleFont(32, width)}px ${scaleFont(90, width)}px rgba(0,0,0,0.44)`,
          opacity: interpolate(mediaEnter, [0, 0.2, 1], [0, 1, 1]),
          transform: `translateY(${(1 - mediaEnter) * scaleFont(18, width)}px) scale(${
            0.97 + mediaEnter * 0.03
          })`,
        }}
      >
        {backgroundSrc ? (
          <Img
            src={backgroundSrc}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              display: "block",
              background: COLORS.panel,
            }}
          />
        ) : (
          <PlaceholderSurface accentColor={accentColor} />
        )}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(6, 8, 16, 0.42)",
            pointerEvents: "none",
          }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          left: scaledTarget.x,
          top: scaledTarget.y,
          width: scaledTarget.width,
          height: scaledTarget.height,
          borderRadius: scaleFont(isPortrait ? 22 : 16, width),
          border: `${Math.max(2, scaleFont(3, width))}px solid ${accentColor}`,
          boxShadow: `0 0 0 ${scaleFont(999, width)}px rgba(5, 7, 14, 0.42), 0 0 ${scaleFont(
            38,
            width,
          )}px ${accentColor}66`,
          opacity: ringEnter,
          transform: `scale(${0.96 + ringEnter * 0.04})`,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: scaledTarget.x - scaleFont(8, width) - pulse * scaleFont(4, width),
          top: scaledTarget.y - scaleFont(8, width) - pulse * scaleFont(4, width),
          width: scaledTarget.width + scaleFont(16, width) + pulse * scaleFont(8, width),
          height: scaledTarget.height + scaleFont(16, width) + pulse * scaleFont(8, width),
          borderRadius: scaleFont(isPortrait ? 28 : 22, width),
          border: `${Math.max(1, scaleFont(2, width))}px solid ${accentColor}`,
          opacity: ringEnter * (0.24 - pulse * 0.1),
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: callout.x,
          top: callout.y,
          width: callout.width,
          minHeight: callout.height,
          maxHeight: height - safe.paddingTop - safe.paddingBottom,
          opacity: calloutEnter,
          transform: `translateY(${(1 - calloutEnter) * scaleFont(14, width)}px) scale(${
            0.98 + calloutEnter * 0.02
          })`,
          transformOrigin: "center center",
          padding: calloutPadding,
          boxSizing: "border-box",
          borderRadius: scaleFont(isPortrait ? 26 : 18, width),
          background: COLORS.panelRaised,
          border: `1px solid rgba(255,255,255,0.12)`,
          borderLeft: `${Math.max(3, scaleFont(5, width))}px solid ${accentColor}`,
          boxShadow: `0 ${scaleFont(22, width)}px ${scaleFont(70, width)}px rgba(0,0,0,0.42)`,
          display: "grid",
          alignContent: "center",
          gap: scaleFont(isPortrait ? 10 : 8, width),
        }}
      >
        {kicker ? (
          <div
            style={{
              color: accentColor,
              fontSize: scaleFont(isPortrait ? 27 : 23, width),
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            {kicker}
          </div>
        ) : null}
        <div
          style={{
            color: COLORS.text,
            fontSize: titleSize,
            fontWeight: 800,
            lineHeight: 1.08,
            overflowWrap: "break-word",
          }}
        >
          {title}
        </div>
        {subtitle ? (
          <div
            style={{
              color: COLORS.muted,
              fontSize: subtitleSize,
              fontWeight: 500,
              lineHeight: 1.25,
              overflowWrap: "break-word",
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </div>
    </div>
  );
};
