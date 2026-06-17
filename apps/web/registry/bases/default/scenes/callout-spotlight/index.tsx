import { loadFont } from "@remotion/google-fonts/Inter";
import { Img, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import {
  clampRectToSafeArea,
  getSafeAreaPadding,
  scaleFont,
  type Rect,
  type SafeAreaPadding,
} from "@/remotion/lib/layout";
import { DURATION, EASING, STAGGER } from "@/remotion/lib/motion-tokens";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "600", "700"],
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
};

const COLORS = {
  bg: "#080810",
  overlay: "rgba(8, 8, 16, 0.76)",
  card: "rgba(8, 8, 16, 0.94)",
  cardBorder: "rgba(255, 255, 255, 0.1)",
  muted: "#a1a1aa",
  accent: "#e8b86d",
} as const;

type CalloutPlacement = {
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
  maxWidth: number;
};

const MIN_CALLOUT_WIDTH = 200;

function getCalloutPlacement({
  target,
  width,
  height,
  safe,
  gap,
}: {
  target: Rect;
  width: number;
  height: number;
  safe: SafeAreaPadding;
  gap: number;
}): CalloutPlacement {
  const rightSpace =
    width - safe.paddingRight - (target.x + target.width + gap);
  const leftSpace = target.x - gap - safe.paddingLeft;
  const belowSpace =
    height - safe.paddingBottom - (target.y + target.height + gap);
  const aboveSpace = target.y - gap - safe.paddingTop;
  const fullWidth = width - safe.paddingLeft - safe.paddingRight;

  const candidates: Array<{ score: number; placement: CalloutPlacement }> = [];

  if (rightSpace >= MIN_CALLOUT_WIDTH) {
    candidates.push({
      score: rightSpace * 1.1,
      placement: {
        left: target.x + target.width + gap,
        top: Math.max(safe.paddingTop, target.y),
        maxWidth: rightSpace,
      },
    });
  }

  if (leftSpace >= MIN_CALLOUT_WIDTH) {
    candidates.push({
      score: leftSpace,
      placement: {
        right: width - (target.x - gap),
        top: Math.max(safe.paddingTop, target.y),
        maxWidth: leftSpace,
      },
    });
  }

  if (belowSpace >= scaleFont(72, width)) {
    candidates.push({
      score: belowSpace * 0.85,
      placement: {
        left: safe.paddingLeft,
        top: target.y + target.height + gap,
        maxWidth: fullWidth,
      },
    });
  }

  if (aboveSpace >= scaleFont(72, width)) {
    candidates.push({
      score: aboveSpace * 0.75,
      placement: {
        left: safe.paddingLeft,
        bottom: height - (target.y - gap),
        maxWidth: fullWidth,
      },
    });
  }

  candidates.sort((a, b) => b.score - a.score);

  return (
    candidates[0]?.placement ?? {
      left: safe.paddingLeft,
      bottom: safe.paddingBottom,
      maxWidth: fullWidth,
    }
  );
}

export const CalloutSpotlight: React.FC<CalloutSpotlightProps> = ({
  title,
  subtitle,
  kicker,
  target,
  backgroundSrc,
  backgroundColor = COLORS.bg,
  accentColor = COLORS.accent,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const safe = getSafeAreaPadding({ width, height });
  const clampedTarget = clampRectToSafeArea(target, width, height);
  const isPortrait = height > width;
  const gap = scaleFont(20, width);

  const ringProgress = interpolate(frame, [0, DURATION.fast], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASING.enter,
  });

  const calloutProgress = interpolate(
    frame,
    [STAGGER.normal, STAGGER.normal + DURATION.fast],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASING.enter,
    },
  );

  const placement = getCalloutPlacement({
    target: clampedTarget,
    width,
    height,
    safe,
    gap,
  });

  const calloutOffset = (1 - calloutProgress) * scaleFont(16, width);
  const slideFromRight =
    placement.left !== undefined &&
    placement.left >= clampedTarget.x + clampedTarget.width;
  const slideFromLeft =
    placement.right !== undefined && placement.top !== undefined;

  return (
    <div
      style={{
        width,
        height,
        background: backgroundColor,
        position: "relative",
        overflow: "hidden",
        color: "white",
        fontFamily,
      }}
    >
      {backgroundSrc ? (
        <Img
          src={backgroundSrc}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      ) : null}

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: COLORS.overlay,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: clampedTarget.x,
          top: clampedTarget.y,
          width: clampedTarget.width,
          height: clampedTarget.height,
          borderRadius: scaleFont(14, width),
          border: `${scaleFont(3, width)}px solid ${accentColor}`,
          boxShadow: `0 0 0 9999px rgba(8, 8, 16, 0.5), 0 0 ${scaleFont(40, width)}px ${accentColor}55`,
          opacity: ringProgress,
          transform: `scale(${0.94 + ringProgress * 0.06})`,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: placement.left,
          right: placement.right,
          top: placement.top,
          bottom: placement.bottom,
          maxWidth: placement.maxWidth,
          opacity: calloutProgress,
          transform: slideFromRight
            ? `translateX(${calloutOffset}px)`
            : slideFromLeft
              ? `translateX(${-calloutOffset}px)`
              : `translateY(${calloutOffset}px)`,
          padding: scaleFont(20, width),
          borderRadius: scaleFont(14, width),
          background: COLORS.card,
          border: `1px solid ${COLORS.cardBorder}`,
          borderLeft: `${scaleFont(4, width)}px solid ${accentColor}`,
          boxShadow: `0 ${scaleFont(16, width)}px ${scaleFont(48, width)}px rgba(0, 0, 0, 0.45)`,
          boxSizing: "border-box",
        }}
      >
        {kicker ? (
          <div
            style={{
              color: accentColor,
              fontSize: scaleFont(26, width),
              fontWeight: 600,
              marginBottom: scaleFont(8, width),
              letterSpacing: "0.02em",
            }}
          >
            {kicker}
          </div>
        ) : null}
        <div
          style={{
            fontSize: scaleFont(isPortrait ? 44 : 40, width),
            fontWeight: 700,
            lineHeight: 1.12,
            letterSpacing: "-0.02em",
            overflowWrap: "break-word",
          }}
        >
          {title}
        </div>
        {subtitle ? (
          <div
            style={{
              color: COLORS.muted,
              fontSize: scaleFont(28, width),
              marginTop: scaleFont(10, width),
              lineHeight: 1.35,
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
