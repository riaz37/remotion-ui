import { loadFont } from "@remotion/google-fonts/Inter";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { CODE_THEMES } from "@/remotion/lib/code-syntax";
import { getSafeAreaPadding } from "@/remotion/lib/layout";
import { EASING } from "@/remotion/lib/motion-tokens";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
});

export type PricingCardProps = {
  /** Tier name across the top of the card. */
  tier?: string;
  /** Chip beside the tier name. Omit to drop it. */
  badge?: string;
  /** The number the price rolls up to. */
  price?: number;
  /** Symbol set ahead of the number. */
  currency?: string;
  /** Cadence printed after the price — "/mo", "per seat", anything short. */
  period?: string;
  /** Line under the price. */
  note?: string;
  /**
   * Price the card was, struck through beside the new one. Omit for a card with
   * no before-and-after story to tell.
   */
  wasPrice?: number;
  features?: string[];
  /** Text in the call-to-action button. Omit to drop the button. */
  ctaLabel?: string;
  /** Second the price starts rolling. */
  priceAtSeconds?: number;
  /** How long the roll takes. */
  rollSeconds?: number;
  /** Second the first feature ticks in. */
  featuresAtSeconds?: number;
  /** Seconds between features. */
  featureStaggerSeconds?: number;
  /**
   * Seconds the finished card holds before it retreats. Omit to leave it up for
   * the rest of the scene.
   */
  holdSeconds?: number;
  accentColor?: string;
  backgroundColor?: string;
  theme?: "dark" | "light";
  /** Animation speed multiplier. */
  speed?: number;
};

const DEFAULT_FEATURES = [
  "2,000 render minutes a month",
  "4K exports, no watermark",
  "9 team seats",
  "Render API and webhooks",
  "Priority render queue",
];

/** Beat plan in seconds. Price and feature times come from the props. */
const T = {
  card: 0,
  cardFor: 0.48,
  head: 0.16,
  headFor: 0.4,
  ctaAfterFeatures: 0.16,
  ctaFor: 0.42,
  exitFor: 0.42,
} as const;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/**
 * A tier card that earns its price: the number rolls up under a soft blur that
 * clears as it settles, the features tick in one at a time beneath it, and the
 * call to action arrives last so the card finishes on the thing you want clicked.
 *
 * The roll is a plain interpolation on the value rather than a spinning digit
 * strip. A strip has to guess glyph widths; a counted number stays in register
 * with `tabular-nums` at any font size, and reads as counting rather than as a
 * slot machine.
 */
export const PricingCard: React.FC<PricingCardProps> = ({
  tier = "Studio",
  badge = "Most picked",
  price = 32,
  currency = "$",
  period = "/mo",
  note = "Billed annually. Cancel whenever.",
  wasPrice,
  features = DEFAULT_FEATURES,
  ctaLabel = "Start rendering",
  priceAtSeconds = 0.42,
  rollSeconds = 0.9,
  featuresAtSeconds = 1.05,
  featureStaggerSeconds = 0.22,
  holdSeconds,
  accentColor = "#E8B86D",
  backgroundColor,
  theme = "dark",
  speed = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const palette = CODE_THEMES[theme];
  const safe = getSafeAreaPadding({ width, height });

  const at = (seconds: number) => (seconds * fps) / speed;
  const ease = (from: number, to: number, easing = EASING.enter) =>
    interpolate(frame, [at(from), at(to)], [0, 1], { easing, ...clamp });

  const portrait = height > width;
  const u = portrait
    ? Math.min(width / 620, height / 1120)
    : Math.min(width / 1280, height / 720);

  const cardIn = spring({
    frame: frame - at(T.card),
    fps,
    config: { damping: 18, stiffness: 130, mass: 0.85 },
  });
  const open = ease(T.card, T.card + T.cardFor, EASING.editorial);
  const headIn = ease(T.head, T.head + T.headFor);

  const roll = ease(priceAtSeconds, priceAtSeconds + rollSeconds, EASING.editorial);
  const shown = Math.round(interpolate(roll, [0, 1], [0, price]));
  // Motion blur only while the digits are actually changing — it clears over the
  // last third of the roll so the settled price is never soft.
  const rollBlur = Math.sin(Math.PI * roll) * 2.2;

  const lastFeatureAt =
    featuresAtSeconds + Math.max(0, features.length - 1) * featureStaggerSeconds;
  const ctaAt = lastFeatureAt + T.ctaAfterFeatures;
  const ctaIn = ease(ctaAt, ctaAt + T.ctaFor, EASING.pop);

  const exit =
    holdSeconds === undefined
      ? 0
      : interpolate(frame, [at(holdSeconds), at(holdSeconds + T.exitFor)], [0, 1], {
          easing: EASING.exit,
          ...clamp,
        });

  const cardW = Math.min(width - safe.paddingLeft - safe.paddingRight, 460 * u);
  const pad = 30 * u;

  return (
    <AbsoluteFill
      style={{
        background: backgroundColor ?? palette.page,
        fontFamily,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: `${safe.paddingTop}px ${safe.paddingRight}px`,
      }}
    >
      <div
        style={{
          width: cardW,
          borderRadius: 24 * u,
          background: palette.window,
          border: `1px solid ${accentColor}3A`,
          boxShadow: `inset 0 1px 0 ${palette.highlight}, 0 ${28 * u}px ${
            70 * u
          }px ${palette.shadow}`,
          padding: pad,
          position: "relative",
          overflow: "hidden",
          clipPath: `inset(0 0 ${(1 - open) * 100}% 0 round ${24 * u}px)`,
          opacity: 1 - exit,
          transform: `translateY(${(1 - cardIn) * 24 * u + exit * 32 * u}px)`,
        }}
      >
        {/* A single warm wash off the top-left corner. It sits under everything
            so the card has depth without any element carrying its own gradient. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(120% 80% at 8% 0%, ${accentColor}1F, transparent 62%)`,
          }}
        />

        <div style={{ position: "relative" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10 * u,
              opacity: headIn,
              transform: `translateY(${(1 - headIn) * 10 * u}px)`,
            }}
          >
            <span
              style={{
                color: palette.fg,
                fontSize: 19 * u,
                fontWeight: 700,
                letterSpacing: "0.02em",
              }}
            >
              {tier}
            </span>
            {badge ? (
              <span
                style={{
                  padding: `${3.5 * u}px ${9 * u}px`,
                  borderRadius: 999,
                  background: `${accentColor}22`,
                  border: `1px solid ${accentColor}66`,
                  color: accentColor,
                  fontSize: 12 * u,
                  fontWeight: 600,
                }}
              >
                {badge}
              </span>
            ) : null}
          </div>

          <div
            style={{
              marginTop: 16 * u,
              display: "flex",
              alignItems: "baseline",
              gap: 8 * u,
              filter: rollBlur > 0.05 ? `blur(${rollBlur}px)` : undefined,
            }}
          >
            <span
              style={{
                color: palette.dim,
                fontSize: 30 * u,
                fontWeight: 600,
                opacity: roll > 0 ? 1 : 0,
              }}
            >
              {currency}
            </span>
            <span
              style={{
                color: palette.fg,
                fontSize: 68 * u,
                fontWeight: 800,
                letterSpacing: "-0.04em",
                lineHeight: 1,
                fontVariantNumeric: "tabular-nums",
                // The number lifts as it counts, so the roll has motion even on
                // a tier whose price is a single digit.
                transform: `translateY(${(1 - roll) * 10 * u}px)`,
                opacity: roll > 0 ? 1 : 0,
              }}
            >
              {shown}
            </span>
            {period ? (
              <span
                style={{
                  color: palette.dim,
                  fontSize: 19 * u,
                  fontWeight: 600,
                  opacity: interpolate(roll, [0.5, 1], [0, 1], clamp),
                }}
              >
                {period}
              </span>
            ) : null}
            {wasPrice !== undefined ? (
              <span
                style={{
                  marginLeft: 4 * u,
                  color: palette.faint,
                  fontSize: 20 * u,
                  fontWeight: 600,
                  textDecoration: "line-through",
                  fontVariantNumeric: "tabular-nums",
                  opacity: interpolate(roll, [0.7, 1], [0, 1], clamp),
                }}
              >
                {currency}
                {wasPrice}
              </span>
            ) : null}
          </div>

          {note ? (
            <div
              style={{
                marginTop: 6 * u,
                color: palette.dim,
                fontSize: 14 * u,
                fontWeight: 500,
                opacity: interpolate(roll, [0.6, 1], [0, 1], clamp),
              }}
            >
              {note}
            </div>
          ) : null}

          <div
            style={{
              marginTop: 20 * u,
              paddingTop: 18 * u,
              borderTop: `1px solid ${palette.border}`,
              display: "flex",
              flexDirection: "column",
              gap: 12 * u,
            }}
          >
            {features.map((feature, index) => {
              const featureAt = featuresAtSeconds + index * featureStaggerSeconds;
              const featureIn = ease(featureAt, featureAt + 0.38);
              return (
                <div
                  key={feature}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 11 * u,
                    opacity: featureIn,
                    transform: `translateX(${(1 - featureIn) * -10 * u}px)`,
                  }}
                >
                  <svg width={18 * u} height={18 * u} viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="11" fill={`${accentColor}22`} />
                    <path
                      d="M6.5 12.5 L10.5 16.5 L17.5 8"
                      stroke={accentColor}
                      strokeWidth={2.6}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      pathLength={1}
                      strokeDasharray={1}
                      strokeDashoffset={1 - featureIn}
                    />
                  </svg>
                  <span
                    style={{
                      color: palette.fg,
                      fontSize: 15.5 * u,
                      fontWeight: 500,
                    }}
                  >
                    {feature}
                  </span>
                </div>
              );
            })}
          </div>

          {ctaLabel ? (
            <div
              style={{
                marginTop: 22 * u,
                height: 48 * u,
                borderRadius: 12 * u,
                background: accentColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: theme === "dark" ? "#141013" : "#1B1509",
                fontSize: 16.5 * u,
                fontWeight: 700,
                letterSpacing: "0.01em",
                opacity: Math.min(1, ctaIn * 1.4),
                transform: `scale(${0.94 + ctaIn * 0.06})`,
                boxShadow: `0 ${10 * u}px ${26 * u}px ${accentColor}33`,
              }}
            >
              {ctaLabel}
            </div>
          ) : null}
        </div>
      </div>
    </AbsoluteFill>
  );
};
