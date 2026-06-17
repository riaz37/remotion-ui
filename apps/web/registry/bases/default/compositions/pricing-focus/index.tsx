import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { EASING_ENTER } from "@/remotion/lib/timing";

export type PricingFocusProps = {
  tiers?: Array<{ name: string; price: string; featured?: boolean }>;
};

const DEFAULT_TIERS = [
  { name: "Starter", price: "$0" },
  { name: "Studio", price: "$29", featured: true },
  { name: "Team", price: "$99" },
];

export const PricingFocus: React.FC<PricingFocusProps> = ({
  tiers = DEFAULT_TIERS,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const safe = getSafeAreaPadding({ width, height });
  const focusIndex = tiers.findIndex((t) => t.featured);

  return (
    <AbsoluteFill style={{ background: "#080810" }}>
      <div
        style={{
          display: "flex",
          gap: 24,
          justifyContent: "center",
          alignItems: "flex-end",
          height: "100%",
          padding: `${safe.paddingTop}px ${safe.paddingRight}px ${safe.paddingBottom}px ${safe.paddingLeft}px`,
        }}
      >
        {tiers.map((tier, i) => {
          const isFeatured = i === focusIndex;
          const enter = interpolate(frame, [i * 8, i * 8 + 24], [0, 1], {
            easing: EASING_ENTER,
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const lift = isFeatured
            ? interpolate(frame, [30, 50], [0, 1], {
                easing: EASING_ENTER,
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              })
            : 0;

          return (
            <div
              key={tier.name}
              style={{
                width: 220,
                minHeight: 280 + lift * 40,
                borderRadius: 20,
                border: `1px solid ${isFeatured ? "rgba(232,184,109,0.55)" : "rgba(148,163,184,0.16)"}`,
                background: isFeatured ? "rgba(232,184,109,0.12)" : "rgba(12,16,24,0.92)",
                filter: isFeatured ? "none" : `blur(${lift * 2}px)`,
                transform: `translateY(${-lift * 24}px) scale(${isFeatured ? 1 + lift * 0.04 : 0.96})`,
                padding: 24,
                display: "grid",
                gap: 12,
                alignContent: "start",
                opacity: enter * (isFeatured ? 1 : 0.75),
              }}
            >
              <div style={{ color: "#e2e8f0", fontSize: scaleFont(24, width), fontWeight: 600 }}>
                {tier.name}
              </div>
              <div style={{ color: "#e8b86d", fontSize: scaleFont(40, width), fontWeight: 700 }}>
                {tier.price}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
