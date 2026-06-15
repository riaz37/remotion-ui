import { loadFont } from "@remotion/google-fonts/Inter";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { DELAY, DURATION } from "@/remotion/lib/motion-tokens";

const { fontFamily } = loadFont("normal", {
  weights: ["500", "700", "800"],
  subsets: ["latin"],
});

export type CommentCalloutProps = {
  body: string;
  author?: string;
  handle?: string;
  initials?: string;
  replyLabel?: string;
  accentColor?: string;
  backgroundColor?: string;
};

const COLORS = {
  bg: "#0f0d18",
  card: "rgba(255,255,255,0.08)",
  border: "rgba(255,255,255,0.14)",
  text: "#fafafa",
  muted: "#a1a1aa",
  avatarFg: "#0f0d18",
  accent: "#c4b5fd",
} as const;

export const CommentCallout: React.FC<CommentCalloutProps> = ({
  body,
  author,
  handle,
  initials,
  replyLabel,
  accentColor = COLORS.accent,
  backgroundColor = COLORS.bg,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const safeArea = getSafeAreaPadding({ width, height });
  const cardEnter = interpolate(frame, [0, DURATION.fast], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const replyEnter = interpolate(
    frame,
    [DELAY.medium, DELAY.medium + DURATION.normal],
    [0, 1],
    {
    extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const showIdentity = Boolean(author || handle || initials);
  const avatarText =
    initials ?? (author ? author.slice(0, 2).toUpperCase() : undefined);

  return (
    <div
      style={{
        width,
        height,
        paddingLeft: safeArea.paddingLeft,
        paddingRight: safeArea.paddingRight,
        paddingTop: safeArea.paddingTop,
        paddingBottom: safeArea.paddingBottom,
        position: "relative",
        overflow: "hidden",
        background: backgroundColor,
        color: COLORS.text,
        fontFamily,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 24% 16%, ${accentColor}30, transparent 36%)`,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: width * 0.84,
          borderRadius: scaleFont(20, width),
          padding: scaleFont(32, width),
          background: COLORS.card,
          border: `1px solid ${COLORS.border}`,
          boxShadow: `0 ${scaleFont(24, width)}px ${scaleFont(72, width)}px rgba(0,0,0,0.32)`,
          opacity: cardEnter,
          transform: `translateY(${(1 - cardEnter) * 36}px) scale(${0.96 + cardEnter * 0.04})`,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: scaleFont(20, width),
            alignItems: "flex-start",
          }}
        >
          {showIdentity && avatarText ? (
            <div
              style={{
                flex: "0 0 auto",
                width: scaleFont(72, width),
                height: scaleFont(72, width),
                borderRadius: "50%",
                background: accentColor,
                color: COLORS.avatarFg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: scaleFont(26, width),
                fontWeight: 800,
              }}
            >
              {avatarText}
            </div>
          ) : null}
          <div style={{ minWidth: 0, flex: 1 }}>
            {author || handle ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: scaleFont(12, width),
                  flexWrap: "wrap",
                  marginBottom: scaleFont(14, width),
                }}
              >
                {author ? (
                  <div
                    style={{
                      fontSize: scaleFont(30, width),
                      fontWeight: 700,
                    }}
                  >
                    {author}
                  </div>
                ) : null}
                {handle ? (
                  <div
                    style={{
                      color: COLORS.muted,
                      fontSize: scaleFont(24, width),
                      fontWeight: 500,
                    }}
                  >
                    {handle}
                  </div>
                ) : null}
              </div>
            ) : null}
            <p
              style={{
                margin: 0,
                fontSize: scaleFont(48, width),
                lineHeight: 1.12,
                fontWeight: 700,
                letterSpacing: "-0.01em",
              }}
            >
              {body}
            </p>
          </div>
        </div>
        {replyLabel ? (
          <div
            style={{
              marginTop: scaleFont(28, width),
              display: "inline-flex",
              alignItems: "center",
              gap: scaleFont(10, width),
              borderRadius: 999,
              padding: `${scaleFont(12, width)}px ${scaleFont(20, width)}px`,
              background: `${accentColor}22`,
              color: accentColor,
              fontSize: scaleFont(22, width),
              fontWeight: 700,
              opacity: replyEnter,
              transform: `translateX(${(1 - replyEnter) * -16}px)`,
            }}
          >
            <span
              style={{
                width: scaleFont(8, width),
                height: scaleFont(8, width),
                borderRadius: "50%",
                background: accentColor,
              }}
            />
            {replyLabel}
          </div>
        ) : null}
      </div>
    </div>
  );
};
