import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { EASING_ENTER, EASING_EXIT } from "@/remotion/lib/timing";

export type PricingTier = {
  name: string;
  price: string;
  /** Billing cadence printed next to the price. */
  period?: string;
  /** Three to four short bullets — they stagger in during the hold. */
  features?: string[];
  /** Button label at the foot of the card. */
  cta?: string;
  featured?: boolean;
};

export type PricingFocusProps = {
  tiers?: PricingTier[];
};

const DEFAULT_TIERS: PricingTier[] = [
  {
    name: "Starter",
    price: "$0",
    period: "/mo",
    features: ["12 components", "720p renders", "Community support"],
    cta: "Start free",
  },
  {
    name: "Studio",
    price: "$29",
    period: "/mo",
    features: [
      "Full registry",
      "4K renders",
      "Brand presets",
      "Priority support",
    ],
    cta: "Choose Studio",
    featured: true,
  },
  {
    name: "Team",
    price: "$99",
    period: "/mo",
    features: ["Seats for 10", "Shared presets", "Render queue"],
    cta: "Talk to us",
  },
];

/** Featured card locks focus over this window — non-featured cards defocus in step. */
const FOCUS_START = 30;
const FOCUS_END = 50;

/** Feature bullets arrive across the hold so the middle of the clip is not static. */
const BULLETS_START = 50;
const BULLETS_END = 110;
/** Button lands after the last bullet on the longest card. */
const CTA_START = 106;
const CTA_END = 126;

/**
 * Exit beat: cards leave staggered, featured card last so it holds the eye
 * longest. `EASING_EXIT` is `Easing.in(Easing.cubic)`, so a window is only ~12%
 * resolved at its halfway point — the exit has to *start* well before the 90%
 * sample (frame 162 of 180) for that sample to show any departure at all.
 * 142 + 2×6 stagger + 26 lands the last card exactly on frame 180.
 */
const EXIT_START = 142;
const EXIT_STAGGER = 6;
const EXIT_DURATION = 26;

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
          const cardScale =
            (isFeatured ? 1 + lift * 0.04 : 0.96 - focus * 0.02) * breatheScale;
          const features = tier.features ?? [];
          const ctaIn = interpolate(frame, [CTA_START, CTA_END], [0, 1], {
            easing: EASING_ENTER,
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          return (
            <div
              key={tier.name}
              style={{
                width: 250,
                minHeight: 350 + lift * 36,
                borderRadius: 20,
                border: `1px solid ${isFeatured ? "rgba(232,184,109,0.55)" : "rgba(148,163,184,0.16)"}`,
                background: isFeatured ? "rgba(232,184,109,0.12)" : "rgba(12,16,24,0.92)",
                filter: isFeatured ? "none" : `blur(${focus * 3}px)`,
                translate: `0px ${-lift * 24 + exit * 32}px`,
                scale: `${cardScale}`,
                padding: 22,
                display: "grid",
                gridTemplateRows: "auto auto 1fr auto",
                gap: 14,
                opacity: enter * (isFeatured ? 1 : 1 - focus * 0.25) * (1 - exit),
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    color: "#e2e8f0",
                    fontSize: scaleFont(26, width),
                    fontWeight: 700,
                  }}
                >
                  {tier.name}
                </div>
                {isFeatured ? (
                  <div
                    style={{
                      borderRadius: 999,
                      padding: "4px 10px",
                      background: "rgba(232,184,109,0.22)",
                      color: "#e8b86d",
                      fontSize: scaleFont(16, width),
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Popular
                  </div>
                ) : null}
              </div>

              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span
                  style={{
                    color: "#e8b86d",
                    fontSize: scaleFont(46, width),
                    fontWeight: 700,
                    lineHeight: 1,
                  }}
                >
                  {tier.price}
                </span>
                {tier.period ? (
                  <span
                    style={{
                      color: "#8b93a1",
                      fontSize: scaleFont(20, width),
                      fontWeight: 600,
                    }}
                  >
                    {tier.period}
                  </span>
                ) : null}
              </div>

              <div style={{ display: "grid", gap: 10, alignContent: "start" }}>
                {features.map((feature, fi) => {
                  // Bullets arrive one after another through the middle of the
                  // clip; the last card's last bullet lands at BULLETS_END.
                  const step = (BULLETS_END - BULLETS_START) / 5;
                  const at = BULLETS_START + (i * 1.1 + fi) * step;
                  const bulletIn = interpolate(frame, [at, at + step * 1.4], [0, 1], {
                    easing: EASING_ENTER,
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  });
                  return (
                    <div
                      key={feature}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 9,
                        color: "#cbd5e1",
                        fontSize: scaleFont(20, width),
                        fontWeight: 600,
                        opacity: bulletIn,
                        translate: `${(1 - bulletIn) * -12}px 0px`,
                      }}
                    >
                      <svg width={15} height={15} viewBox="0 0 16 16" fill="none">
                        <path
                          d="M3 8.4l3.1 3.1L13 4.6"
                          stroke={isFeatured ? "#e8b86d" : "#2dd4bf"}
                          strokeWidth={2.2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {feature}
                    </div>
                  );
                })}
              </div>

              {tier.cta ? (
                <div
                  style={{
                    borderRadius: 12,
                    padding: "11px 0",
                    textAlign: "center",
                    background: isFeatured ? "#e8b86d" : "rgba(148,163,184,0.14)",
                    color: isFeatured ? "#0b0d14" : "#e2e8f0",
                    fontSize: scaleFont(20, width),
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    opacity: ctaIn,
                    translate: `0px ${(1 - ctaIn) * 10}px`,
                  }}
                >
                  {tier.cta}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
