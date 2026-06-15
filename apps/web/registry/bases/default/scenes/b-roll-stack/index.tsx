import { loadFont } from "@remotion/google-fonts/Inter";
import { Img, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { DURATION, STAGGER } from "@/remotion/lib/motion-tokens";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "700", "800"],
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
  bg: "#0e0c12",
  cardBg: "#18141f",
  accent: "#ec4899",
} as const;

const CARD_OFFSETS = [
  { top: 0, left: 0, rotate: -6, zIndex: 4 },
  { top: 28, left: 36, rotate: 4, zIndex: 3 },
  { top: 56, left: 72, rotate: -2, zIndex: 2 },
  { top: 84, left: 108, rotate: 7, zIndex: 1 },
] as const;

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
  const stackHeight = Math.round(height * (isPortrait ? 0.42 : 0.58));

  return (
    <div
      style={{
        width,
        height,
        background: backgroundColor,
        color: "white",
        paddingLeft: safe.paddingLeft,
        paddingRight: safe.paddingRight,
        paddingTop: safe.paddingTop,
        paddingBottom: safe.paddingBottom,
        fontFamily,
        display: "flex",
        flexDirection: isPortrait ? "column" : "row",
        gap: scaleFont(40, width),
        alignItems: isPortrait ? "stretch" : "center",
      }}
    >
      <div style={{ flex: isPortrait ? undefined : "0 0 38%" }}>
        {kicker ? (
          <div
            style={{
              color: accentColor,
              fontSize: scaleFont(32, width),
              fontWeight: 800,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            {kicker}
          </div>
        ) : null}
        {title ? (
          <h2
            style={{
              fontSize: scaleFont(84, width),
              lineHeight: 1.05,
              margin: kicker ? `${scaleFont(12, width)}px 0 0` : 0,
              fontWeight: 800,
              letterSpacing: "-0.02em",
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
        }}
      >
        {items.slice(0, 4).map((item, index) => {
          const offset = CARD_OFFSETS[index] ?? CARD_OFFSETS[0];
          const delay = index * STAGGER.relaxed;
          const progress = interpolate(
            frame,
            [delay, delay + DURATION.fast],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );

          return (
            <div
              key={`${item.src}-${index}`}
              style={{
                position: "absolute",
                top: offset.top,
                left: offset.left,
                right: offset.left,
                bottom: offset.top,
                zIndex: offset.zIndex,
                borderRadius: 20,
                overflow: "hidden",
                border: "2px solid rgba(248,250,252,0.1)",
                background: COLORS.cardBg,
                boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
                opacity: progress,
                transform: `translateY(${(1 - progress) * 40}px) rotate(${offset.rotate * progress}deg)`,
              }}
            >
              <Img
                src={item.src}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              {item.title ? (
                <div
                  style={{
                    position: "absolute",
                    left: scaleFont(18, width),
                    right: scaleFont(18, width),
                    top: scaleFont(18, width),
                    fontSize: scaleFont(26, width),
                    fontWeight: 700,
                    textShadow: "0 2px 12px rgba(0,0,0,0.85)",
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
