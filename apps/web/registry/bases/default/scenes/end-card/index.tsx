import { loadFont } from "@remotion/google-fonts/Inter";
import { Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { DELAY, DURATION, EASING } from "@/remotion/lib/motion-tokens";

const { fontFamily } = loadFont("normal", {
  weights: ["500", "700"],
  subsets: ["latin"],
});

export type EndCardProps = {
  title: string;
  cta?: string;
  url?: string;
  logoSrc?: string;
  logoSize?: number;
  backgroundColor?: string;
  accentColor?: string;
};

const COLORS = {
  bg: "#080810",
  title: "#f0fdfa",
  url: "#e8b86d",
  muted: "#64748b",
  accent: "#e8b86d",
} as const;

export const EndCard: React.FC<EndCardProps> = ({
  title,
  cta,
  url,
  logoSrc,
  logoSize,
  backgroundColor = COLORS.bg,
  accentColor = COLORS.accent,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const safeArea = getSafeAreaPadding({ width, height });

  const titleEnter = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 110, mass: 0.85 },
  });
  const logoEnter = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 120, mass: 0.8 },
    delay: DELAY.short,
  });
  const ctaEnter = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 160, mass: 0.75 },
    delay: DELAY.medium,
  });
  const urlReveal = interpolate(
    frame,
    [DELAY.medium + DURATION.fast, DELAY.medium + DURATION.fast + DURATION.normal],
    [0, 1],
    {
      easing: EASING.enter,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  return (
    <div
      style={{
        width,
        height,
        backgroundColor,
        backgroundImage: `radial-gradient(ellipse 70% 50% at 50% 100%, ${accentColor}18, transparent)`,
        paddingLeft: safeArea.paddingLeft,
        paddingRight: safeArea.paddingRight,
        paddingTop: safeArea.paddingTop,
        paddingBottom: safeArea.paddingBottom,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: scaleFont(20, width),
          maxWidth: "88%",
          textAlign: "center",
        }}
      >
        {logoSrc ? (
          <Img
            src={logoSrc}
            style={{
              width: logoSize ?? scaleFont(112, width),
              height: logoSize ?? scaleFont(112, width),
              borderRadius: scaleFont(24, width),
              display: "block",
              opacity: Math.min(1, logoEnter),
              transform: `scale(${0.88 + logoEnter * 0.12})`,
            }}
          />
        ) : null}
        <h1
          style={{
            color: COLORS.title,
            fontSize: scaleFont(logoSrc ? 52 : 84, width),
            fontWeight: 700,
            margin: 0,
            lineHeight: 1.08,
            letterSpacing: "-0.02em",
            opacity: Math.min(1, titleEnter),
            transform: `translateY(${(1 - titleEnter) * 24}px)`,
          }}
        >
          {title}
        </h1>
        {cta ? (
          <div
            style={{
              backgroundColor: accentColor,
              color: COLORS.bg,
              fontSize: scaleFont(32, width),
              fontWeight: 700,
              padding: `${scaleFont(14, width)}px ${scaleFont(32, width)}px`,
              borderRadius: 999,
              boxShadow: `0 ${scaleFont(8, width)}px ${scaleFont(24, width)}px ${accentColor}44`,
              opacity: Math.min(1, ctaEnter),
              transform: `translateY(${(1 - ctaEnter) * 20}px) scale(${0.92 + ctaEnter * 0.08})`,
            }}
          >
            {cta}
          </div>
        ) : null}
        {url ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: scaleFont(10, width),
              opacity: urlReveal,
              transform: `translateY(${(1 - urlReveal) * 12}px)`,
            }}
          >
            <p
              style={{
                color: COLORS.url,
                fontSize: scaleFont(28, width),
                margin: 0,
                fontWeight: 500,
                letterSpacing: "0.02em",
              }}
            >
              {url}
            </p>
            <div
              style={{
                width: `${urlReveal * 100}%`,
                maxWidth: scaleFont(240, width),
                height: scaleFont(2, width),
                borderRadius: 999,
                backgroundColor: accentColor,
                opacity: 0.7,
              }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
};
