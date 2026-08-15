import { loadFont } from "@remotion/google-fonts/Inter";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { LineChartDraw } from "@/remotion/primitives/line-chart-draw";
import { formatCompactNumber, readDelta } from "@/remotion/lib/chart-utils";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { DURATION, EASING, STAGGER } from "@/remotion/lib/motion-tokens";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export type MetricTickerItem = {
  label: string;
  value: number;
  /** Unit appended to the counted value, e.g. `"min"`. */
  suffix?: string;
  /** Symbol placed before the value, e.g. `"$"`. */
  prefix?: string;
  /** Signed change, e.g. `"+18%"` — the sign picks the colour and arrow. */
  delta?: string;
  /** Recent history, drawn as a sparkline under the value. */
  trend?: number[];
  /** Overrides `accentColor` for this card. */
  color?: string;
};

export type MetricTickerProps = {
  metrics: MetricTickerItem[];
  title?: string;
  /** Short label above the title. */
  eyebrow?: string;
  /** Formats the counted value. */
  valueFormatter?: (value: number) => string;
  /** Cards beyond this count are dropped rather than squeezed. */
  maxCards?: number;
  backgroundColor?: string;
  accentColor?: string;
  /**
   * Seconds after which the panel leaves. Omit to hold — correct inside a
   * `TransitionSeries`, where the transition covers the tail, and wrong on
   * its own, where the scene stands still for the rest of the clip.
   */
  holdSeconds?: number;
};

const COLORS = {
  bg: "#080810",
  ink: "#fafafa",
  label: "rgba(250,250,250,0.58)",
  eyebrow: "rgba(250,250,250,0.44)",
  card: "rgba(250,250,250,0.035)",
  border: "rgba(250,250,250,0.10)",
  accent: "#e8b86d",
  up: "#2dd4bf",
  down: "#f87171",
} as const;

const DELTA_GLYPH = { up: "↑", down: "↓", flat: "" } as const;

/**
 * KPI cards that count themselves in.
 *
 * Cards divide the full content width instead of hugging the left edge, so the
 * row reads as one instrument panel. The counter, the delta chip and the
 * sparkline are all driven off the card's own spring, staggered just enough
 * that the eye lands on each card in reading order.
 */
export const MetricTicker: React.FC<MetricTickerProps> = ({
  metrics,
  title,
  eyebrow,
  valueFormatter = formatCompactNumber,
  maxCards = 4,
  backgroundColor = COLORS.bg,
  accentColor = COLORS.accent,
  holdSeconds,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const safe = getSafeAreaPadding({ width, height });
  const isPortrait = height > width;

  const cards = metrics.slice(0, maxCards);
  const columns = isPortrait ? 1 : Math.max(1, cards.length);
  const gap = scaleFont(20, width);
  const cardPadding = scaleFont(28, width);
  const contentWidth = width - safe.paddingLeft - safe.paddingRight;
  const cardWidth = (contentWidth - gap * (columns - 1)) / columns;
  // Sparklines are drawn at an explicit width, so the card geometry has to be
  // known here rather than left to the layout engine.
  const sparkWidth = Math.max(1, Math.round(cardWidth - cardPadding * 2));
  const sparkHeight = scaleFont(isPortrait ? 56 : 64, width);

  const headerProgress = interpolate(frame, [0, DURATION.normal], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASING.enter,
  });

  // Exits accelerate away; entrances decelerate in. Never ease-out an exit.
  const exit =
    holdSeconds === undefined
      ? 0
      : interpolate(frame, [holdSeconds * fps, (holdSeconds + 0.4) * fps], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASING.exit,
        });

  return (
    <div
      style={{
        width,
        height,
        background: backgroundColor,
        backgroundImage: `radial-gradient(ellipse 70% 50% at 50% 0%, ${accentColor}12, transparent 70%)`,
        color: COLORS.ink,
        fontFamily,
        paddingLeft: safe.paddingLeft,
        paddingRight: safe.paddingRight,
        paddingTop: safe.paddingTop,
        paddingBottom: safe.paddingBottom,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: scaleFont(44, width),
      }}
    >
      {title || eyebrow ? (
        <header
          style={{
            display: "grid",
            gap: scaleFont(10, width),
            opacity: headerProgress * (1 - exit),
            transform: `translateY(${
              (1 - headerProgress) * scaleFont(16, width) +
              exit * scaleFont(-26, width)
            }px)`,
          }}
        >
          {eyebrow ? (
            <span
              style={{
                color: COLORS.eyebrow,
                fontSize: scaleFont(24, width),
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {eyebrow}
            </span>
          ) : null}
          {title ? (
            <h2
              style={{
                margin: 0,
                fontSize: scaleFont(isPortrait ? 72 : 58, width),
                fontWeight: 700,
                lineHeight: 1.02,
                letterSpacing: "-0.025em",
              }}
            >
              {title}
            </h2>
          ) : null}
        </header>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap,
          opacity: 1 - exit,
          transform: `translateY(${exit * scaleFont(-26, width)}px)`,
        }}
      >
        {cards.map((metric, index) => {
          const delay = STAGGER.normal + index * STAGGER.normal;
          const enter = spring({
            frame: frame - delay,
            fps,
            config: { damping: 20, stiffness: 120, mass: 0.9 },
            durationInFrames: DURATION.slow,
          });
          const delta = readDelta(metric.delta);
          const deltaColor =
            delta.direction === "down"
              ? COLORS.down
              : delta.direction === "up"
                ? COLORS.up
                : COLORS.label;
          const cardColor = metric.color ?? accentColor;
          const detailOpacity = interpolate(enter, [0.55, 1], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          return (
            <div
              key={metric.label}
              style={{
                display: "grid",
                gap: scaleFont(14, width),
                alignContent: "start",
                padding: cardPadding,
                borderRadius: scaleFont(18, width),
                background: COLORS.card,
                border: `1px solid ${COLORS.border}`,
                opacity: Math.min(1, enter * 1.6),
                transform: `translateY(${(1 - enter) * scaleFont(22, width)}px)`,
              }}
            >
              <div
                style={{
                  color: COLORS.label,
                  fontSize: scaleFont(24, width),
                  fontWeight: 600,
                  lineHeight: 1,
                }}
              >
                {metric.label}
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: scaleFont(12, width),
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    color: cardColor,
                    fontSize: scaleFont(isPortrait ? 76 : 64, width),
                    fontWeight: 700,
                    lineHeight: 1,
                    letterSpacing: "-0.03em",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {metric.prefix ?? ""}
                  {valueFormatter(metric.value * enter)}
                  {metric.suffix ?? ""}
                </span>
                {delta.text ? (
                  <span
                    style={{
                      color: deltaColor,
                      fontSize: scaleFont(22, width),
                      fontWeight: 600,
                      lineHeight: 1,
                      opacity: detailOpacity,
                    }}
                  >
                    {DELTA_GLYPH[delta.direction]} {delta.text}
                  </span>
                ) : null}
              </div>

              {metric.trend && metric.trend.length > 1 ? (
                <div style={{ opacity: detailOpacity }}>
                  <LineChartDraw
                    points={metric.trend.map((value, pointIndex) => ({
                      x: pointIndex,
                      y: value,
                    }))}
                    width={sparkWidth}
                    height={sparkHeight}
                    // Tinting the sparkline by direction keeps the card from
                    // reading as one flat accent wash and repeats the delta's
                    // meaning in the shape below it.
                    color={delta.text ? deltaColor : cardColor}
                    strokeWidth={Math.max(2, scaleFont(3, width))}
                    showAxis={false}
                    showXLabels={false}
                    includeZero={false}
                    showDots={false}
                    showHead={false}
                    durationInFrames={DURATION.slow}
                    delayInFrames={delay + STAGGER.tight}
                    frame={frame}
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};
