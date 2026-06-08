import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { getSafePadding } from "@/remotion/lib/layout";

export type CommentCalloutProps = {
  body: string;
  author?: string;
  handle?: string;
  initials?: string;
  replyLabel?: string;
  accentColor?: string;
  backgroundColor?: string;
};

export const CommentCallout: React.FC<CommentCalloutProps> = ({
  body,
  author = "Avery Chen",
  handle = "@averycreates",
  initials = "AC",
  replyLabel = "Replying with a clip",
  accentColor = "#a78bfa",
  backgroundColor = "#111827",
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const padding = getSafePadding({ width, height, ratio: 0.09 });
  const cardEnter = interpolate(frame, [0, 24], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const replyEnter = interpolate(frame, [18, 42], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width,
        height,
        padding,
        position: "relative",
        overflow: "hidden",
        background: backgroundColor,
        color: "white",
        fontFamily: "system-ui, sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 26% 18%, ${accentColor}35, transparent 34%), radial-gradient(circle at 78% 78%, ${accentColor}24, transparent 38%)`,
        }}
      />
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: width * 0.82,
          borderRadius: Math.round(width * 0.035),
          padding: Math.round(width * 0.044),
          background: "rgba(255,255,255,0.1)",
          border: "2px solid rgba(255,255,255,0.16)",
          boxShadow: "0 34px 100px rgba(0,0,0,0.28)",
          opacity: cardEnter,
          transform: `translateY(${(1 - cardEnter) * 40}px) scale(${0.96 + cardEnter * 0.04})`,
        }}
      >
        <div style={{ display: "flex", gap: Math.round(width * 0.024) }}>
          <div
            style={{
              flex: "0 0 auto",
              width: Math.round(width * 0.085),
              height: Math.round(width * 0.085),
              borderRadius: "50%",
              background: accentColor,
              color: "#111827",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: Math.round(width * 0.028),
              fontWeight: 900,
            }}
          >
            {initials}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 14,
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  fontSize: Math.round(width * 0.032),
                  fontWeight: 850,
                }}
              >
                {author}
              </div>
              <div
                style={{
                  color: "#9ca3af",
                  fontSize: Math.round(width * 0.024),
                }}
              >
                {handle}
              </div>
            </div>
            <p
              style={{
                margin: "18px 0 0",
                fontSize: Math.round(width * 0.052),
                lineHeight: 1.08,
                fontWeight: 850,
                letterSpacing: 0,
              }}
            >
              {body}
            </p>
          </div>
        </div>
        {replyLabel ? (
          <div
            style={{
              marginTop: Math.round(width * 0.038),
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              borderRadius: 999,
              padding: "14px 22px",
              background: `${accentColor}24`,
              color: accentColor,
              fontSize: Math.round(width * 0.023),
              fontWeight: 850,
              opacity: replyEnter,
              transform: `translateX(${(1 - replyEnter) * -20}px)`,
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
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
