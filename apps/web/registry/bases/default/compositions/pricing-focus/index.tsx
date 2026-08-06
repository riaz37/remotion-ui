import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { EASING_ENTER, EASING_EXIT } from "@/remotion/lib/timing";

export type PricingFocusProps = {
  tiers?: Array<{ name: string; price: string; featured?: boolean }>;
};

const DEFAULT_TIERS = [
  { name: "Starter", price: "$0" },
  { name: "Studio", price: "$29", featured: true },
  { name: "Team", price: "$99" },
];

/** Featured card locks focus over this window — non-featured cards defocus in step. */
const FOCUS_START = 30;
const FOCUS_END = 50;

/** Exit beat: cards leave staggered, featured card last so it holds the eye longest. */
const EXIT_START = 138;
const EXIT_STAGGER = 6;
const EXIT_DURATION = 30;

export const PricingFocus: React.FC<PricingFocusProps> = ({
  tiers = DEFAULT_TIERS,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const safe = getSafeAreaPadding({ width, height });
  const focusIndex = tiers.findIndex((t) => t.featured);

  // Shared focus progress — drives the defocus of non-featured cards once the
  // featured card locks in. Computed once (not per-card) so the "always 0"
  // dead-code trap (blur keyed to a per-card value only set for the featured
  // card) can't recur.
  const focus = interpolate(frame, [FOCUS_START, FOCUS_END], [0, 1], {
    easing: EASING_ENTER,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Gentle breathing on the featured card during the hold, so the still beat
  // reads as alive rather than frozen.
  const breathe =
    frame > FOCUS_END && frame < EXIT_START
      ? Math.sin((frame - FOCUS_END) / 18) * 0.012
      : 0;

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
          const lift = isFeatured ? focus : 0;

          // Featured card exits last so it keeps the eye's attention longest;
          // non-featured cards fill the ranks before it in original order.
          const exitRank = isFeatured
            ? tiers.length - 1
            : i < focusIndex
              ? i
              : i - 1;
          const exitDelay = EXIT_START + exitRank * EXIT_STAGGER;
          const exit = interpolate(frame, [exitDelay, exitDelay + EXIT_DURATION], [0, 1], {
            easing: EASING_EXIT,
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          const breatheScale = isFeatured ? 1 + breathe : 1;

          return (
            <div
              key={tier.name}
              style={{
                width: 220,
                minHeight: 280 + lift * 40,
                borderRadius: 20,
                border: `1px solid ${isFeatured ? "rgba(232,184,109,0.55)" : "rgba(148,163,184,0.16)"}`,
                background: isFeatured ? "rgba(232,184,109,0.12)" : "rgba(12,16,24,0.92)",
                filter: isFeatured ? "none" : `blur(${focus * 3}px)`,
                transform: `translateY(${-lift * 24 + exit * 32}px) scale(${(isFeatured ? 1 + lift * 0.04 : 0.96 - focus * 0.02) * breatheScale})`,
                padding: 24,
                display: "grid",
                gap: 12,
                alignContent: "start",
                opacity: enter * (isFeatured ? 1 : 1 - focus * 0.25) * (1 - exit),
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
