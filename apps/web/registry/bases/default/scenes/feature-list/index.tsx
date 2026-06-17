import { loadFont } from "@remotion/google-fonts/Inter";
import {
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { DELAY, DURATION, EASING, STAGGER } from "@/remotion/lib/motion-tokens";

const { fontFamily } = loadFont("normal", {
  weights: ["500", "600", "700"],
  subsets: ["latin"],
});

export type FeatureListProps = {
  title?: string;
  items?: string[];
  accentColor?: string;
  backgroundColor?: string;
};

const COLORS = {
  bg: "#080810",
  title: "#fafafa",
  item: "#e4e4e7",
  accent: "#f59e0b",
  glow: "rgba(245, 158, 11, 0.14)",
} as const;

const DEFAULT_ITEMS = [
  "Source you own",
  "Registry CLI",
  "Live previews",
] as const;

const FeatureListItem: React.FC<{
  item: string;
  accentColor: string;
}> = ({ item, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  const rowEnter = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 140, mass: 0.82 },
  });

  const textEnter = interpolate(frame, [4, 4 + DURATION.fast], [0, 1], {
    easing: EASING.enter,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const markerSize = scaleFont(12, width);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: scaleFont(20, width),
        opacity: rowEnter,
        transform: `translateX(${(1 - rowEnter) * scaleFont(36, width)}px)`,
      }}
    >
      <div
        style={{
          position: "relative",
          width: markerSize,
          height: markerSize,
          marginTop: scaleFont(16, width),
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: scaleFont(-10, width),
            borderRadius: "50%",
            background: `${accentColor}33`,
            filter: `blur(${scaleFont(8, width)}px)`,
            opacity: rowEnter,
          }}
        />
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            background: accentColor,
            boxShadow: `0 0 ${scaleFont(20, width)}px ${accentColor}88`,
            transform: `scale(${0.5 + rowEnter * 0.5})`,
          }}
        />
      </div>
      <span
        style={{
          color: COLORS.item,
          fontSize: scaleFont(44, width),
          lineHeight: 1.32,
          fontWeight: 500,
          opacity: textEnter,
          transform: `translateY(${(1 - textEnter) * scaleFont(10, width)}px)`,
          overflowWrap: "break-word",
          flex: 1,
          minWidth: 0,
        }}
      >
        {item}
      </span>
    </div>
  );
};

export const FeatureList: React.FC<FeatureListProps> = ({
  title,
  items = [...DEFAULT_ITEMS],
  accentColor = COLORS.accent,
  backgroundColor = COLORS.bg,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const safeArea = getSafeAreaPadding({ width, height });
  const listStart = title ? DELAY.medium + DURATION.fast : 0;

  const titleEnter = title
    ? spring({
        frame,
        fps,
        config: { damping: 16, stiffness: 110, mass: 0.85 },
        delay: DELAY.short,
      })
    : 0;

  return (
    <div
      style={{
        width,
        height,
        backgroundColor,
        paddingLeft: safeArea.paddingLeft,
        paddingRight: safeArea.paddingRight,
        paddingTop: safeArea.paddingTop,
        paddingBottom: safeArea.paddingBottom,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        fontFamily,
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: "48%",
          height: "48%",
          left: "8%",
          top: "18%",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.glow} 0%, transparent 72%)`,
          filter: `blur(${scaleFont(56, width)}px)`,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: scaleFont(40, width),
          maxWidth: width - safeArea.paddingLeft - safeArea.paddingRight,
        }}
      >
        {title ? (
          <div
            style={{
              color: COLORS.title,
              fontSize: scaleFont(84, width),
              fontWeight: 700,
              margin: 0,
              padding: 0,
              border: "none",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              opacity: titleEnter,
              transform: `translateY(${(1 - titleEnter) * scaleFont(20, width)}px)`,
              overflowWrap: "break-word",
            }}
          >
            {title}
          </div>
        ) : null}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: scaleFont(28, width),
          }}
        >
          {items.map((item, index) => (
            <Sequence
              key={`${item}-${index}`}
              from={listStart + index * STAGGER.normal}
              layout="none"
            >
              <FeatureListItem item={item} accentColor={accentColor} />
            </Sequence>
          ))}
        </div>
      </div>
    </div>
  );
};
