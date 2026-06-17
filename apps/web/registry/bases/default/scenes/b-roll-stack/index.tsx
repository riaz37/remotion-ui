import { loadFont } from "@remotion/google-fonts/Inter";
import { Img, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { DURATION, EASING, STAGGER } from "@/remotion/lib/motion-tokens";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "600", "700"],
  subsets: ["latin"],
});

export type BRollItem = {
  src: string;
  title?: string;
};

export type BRollStackProps = {
  items: BRollItem[];
  title?: string;
  kicker?: string;
  backgroundColor?: string;
  accentColor?: string;
};

const COLORS = {
  bg: "#080810",
  cardBg: "#18141f",
  accent: "#e8b86d",
} as const;

type CardOffset = {
  top: number;
  shiftX: number;
  rotate: number;
  zIndex: number;
  depth: number;
};

const LANDSCAPE_CARD_OFFSETS: CardOffset[] = [
  { top: 0, shiftX: 0, rotate: -4, zIndex: 4, depth: 64 },
  { top: 20, shiftX: 28, rotate: 2.5, zIndex: 3, depth: 48 },
  { top: 40, shiftX: 56, rotate: -1.5, zIndex: 2, depth: 32 },
  { top: 60, shiftX: 84, rotate: 4, zIndex: 1, depth: 20 },
];

const PORTRAIT_CARD_OFFSETS: CardOffset[] = [
  { top: 0, shiftX: 0, rotate: -1.5, zIndex: 4, depth: 40 },
  { top: 14, shiftX: 10, rotate: 1.25, zIndex: 3, depth: 30 },
  { top: 28, shiftX: 20, rotate: -1, zIndex: 2, depth: 22 },
  { top: 42, shiftX: 30, rotate: 1.25, zIndex: 1, depth: 14 },
];

export const BRollStack: React.FC<BRollStackProps> = ({
  items,
  title,
  kicker,
  backgroundColor = COLORS.bg,
  accentColor = COLORS.accent,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const safe = getSafeAreaPadding({ width, height });
  const isPortrait = height > width;
  const contentWidth = width - safe.paddingLeft - safe.paddingRight;
  const rotationBleed = scaleFont(isPortrait ? 56 : 40, width);
  const stackHeight = Math.round(
    height * (isPortrait ? 0.38 : 0.58) - (isPortrait ? scaleFont(24, width) : 0),
  );
  const cardOffsets = isPortrait ? PORTRAIT_CARD_OFFSETS : LANDSCAPE_CARD_OFFSETS;
  const cardWidth = contentWidth - rotationBleed * 2;

  const kickerProgress = kicker
    ? interpolate(frame, [0, DURATION.fast], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: EASING.enter,
      })
    : 0;
  const titleProgress = title
    ? interpolate(
        frame,
        [STAGGER.tight, STAGGER.tight + DURATION.fast],
        [0, 1],
        {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASING.enter,
        },
      )
    : 0;

  return (
    <div
      style={{
        width,
        height,
        boxSizing: "border-box",
        background: backgroundColor,
        color: "white",
        paddingLeft: safe.paddingLeft,
        paddingRight: safe.paddingRight,
        paddingTop: safe.paddingTop,
        paddingBottom: safe.paddingBottom,
        fontFamily,
        display: "flex",
        flexDirection: isPortrait ? "column" : "row",
        gap: scaleFont(isPortrait ? 28 : 40, width),
        alignItems: isPortrait ? "stretch" : "center",
      }}
    >
      <div style={{ flex: isPortrait ? undefined : "0 0 38%", minWidth: 0 }}>
        {kicker ? (
          <div
            style={{
              color: accentColor,
              fontSize: scaleFont(isPortrait ? 28 : 32, width),
              fontWeight: 600,
              opacity: kickerProgress,
              transform: `translateY(${(1 - kickerProgress) * 12}px)`,
            }}
          >
            {kicker}
          </div>
        ) : null}
        {title ? (
          <h2
            style={{
              fontSize: scaleFont(isPortrait ? 52 : 84, width),
              lineHeight: 1.08,
              margin: kicker ? `${scaleFont(12, width)}px 0 0` : 0,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              opacity: titleProgress,
              transform: `translateY(${(1 - titleProgress) * 16}px)`,
            }}
          >
            {title}
          </h2>
        ) : null}
      </div>
      <div
        style={{
          position: "relative",
          flex: 1,
          height: stackHeight,
          minHeight: stackHeight,
          width: isPortrait ? "100%" : undefined,
          boxSizing: "border-box",
        }}
      >
        {items.slice(0, 4).map((item, index) => {
          const offset = cardOffsets[index] ?? cardOffsets[0]!;
          const delay = STAGGER.relaxed + index * STAGGER.relaxed;
          const progress = interpolate(
            frame,
            [delay, delay + DURATION.fast],
            [0, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: EASING.enter,
            },
          );
          const labelPad = scaleFont(16, width);
          const cardHeight = stackHeight - offset.top;

          return (
            <div
              key={`${item.src}-${index}`}
              style={{
                position: "absolute",
                top: offset.top,
                left: rotationBleed,
                width: cardWidth,
                height: cardHeight,
                zIndex: offset.zIndex,
                borderRadius: scaleFont(20, width),
                overflow: "hidden",
                border: "1px solid rgba(248,250,252,0.12)",
                background: COLORS.cardBg,
                boxShadow: `0 ${offset.depth}px ${offset.depth * 2}px rgba(0,0,0,0.45)`,
                opacity: progress,
                transform: `translateX(${offset.shiftX * progress}px) translateY(${(1 - progress) * 36}px) rotate(${offset.rotate * progress}deg) scale(${0.96 + progress * 0.04})`,
                transformOrigin: "center center",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Img
                src={item.src}
                style={{
                  flex: 1,
                  minHeight: 0,
                  width: "100%",
                  objectFit: isPortrait ? "contain" : "cover",
                  backgroundColor: COLORS.cardBg,
                }}
              />
              {item.title ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: `${labelPad}px ${labelPad}px ${labelPad + 2}px`,
                    fontSize: scaleFont(26, width),
                    fontWeight: 600,
                    background:
                      "linear-gradient(to top, rgba(8,8,16,0.92), rgba(8,8,16,0.55))",
                  }}
                >
                  {item.title}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};
