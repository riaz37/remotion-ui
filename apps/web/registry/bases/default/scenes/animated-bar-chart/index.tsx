import { loadFont } from "@remotion/google-fonts/Inter";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  formatAxisValue,
  formatCompactNumber,
  niceDomain,
  readDelta,
  type ChartDatum,
} from "@/remotion/lib/chart-utils";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { DURATION, EASING, STAGGER } from "@/remotion/lib/motion-tokens";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export type AnimatedBarChartProps = {
  data: ChartDatum[];
  title?: string;
  /** Supporting line under the title — the read, not a repeat of the title. */
  subtitle?: string;
  /** Fixed axis top. Defaults to a rounded domain above the largest bar. */
  maxValue?: number;
  /** Formats the value on the end of each bar. */
  valueFormatter?: (value: number) => string;
  /** Label of the bar that carries `accentColor`. */
  highlightLabel?: string;
  /** Vertical gridlines and the value axis under the bars. */
  showAxis?: boolean;
  /** Bars beyond this count are dropped rather than squeezed. */
  maxBars?: number;
  barColor?: string;
  accentColor?: string;
  backgroundColor?: string;
};

const COLORS = {
  bg: "#080810",
  label: "rgba(250,250,250,0.62)",
  axis: "rgba(250,250,250,0.42)",
  grid: "rgba(250,250,250,0.08)",
  track: "rgba(250,250,250,0.05)",
  ink: "#fafafa",
  bar: "#2dd4bf",
  accent: "#e8b86d",
  up: "#2dd4bf",
  down: "#f87171",
} as const;

/**
 * Ranked bar chart scene.
 *
 * Bars are measured against a rounded axis rather than the largest value, so
 * the longest bar stops short of the frame edge and the numbers under it read
 * as a scale instead of decoration. Each bar's length and its counter share one
 * spring — the number can never claim a total the bar has not reached yet.
 */
export const AnimatedBarChart: React.FC<AnimatedBarChartProps> = ({
  data,
  title,
  subtitle,
  maxValue,
  valueFormatter = formatCompactNumber,
  highlightLabel,
  showAxis = true,
  maxBars = 6,
  barColor = COLORS.bar,
  accentColor = COLORS.accent,
  backgroundColor = COLORS.bg,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const safe = getSafeAreaPadding({ width, height });
  const isPortrait = height > width;

  const bars = data.slice(0, maxBars);
  const domain = niceDomain(
    maxValue === undefined ? bars.map((item) => item.value) : [0, maxValue],
    // Fewer ticks in portrait, but not so few that the axis rounds up to
    // double the largest bar and throws away half the width.
    { includeZero: true, tickCount: isPortrait ? 3 : 4 },
  );

  const gap = scaleFont(16, width);
  const longestLabel = bars.reduce(
    (longest, item) => Math.max(longest, item.label.length),
    0,
  );
  const labelSize = scaleFont(isPortrait ? 30 : 28, width);
  const valueSize = scaleFont(isPortrait ? 32 : 30, width);
  // Gutters are sized from the actual copy so nothing truncates and no bar
  // column is thrown away on padding that holds two characters.
  const labelWidth = Math.min(
    Math.round(width * 0.26),
    Math.round(Math.min(longestLabel, 14) * labelSize * 0.62) + gap,
  );
  const valueWidth = Math.round(scaleFont(96, width));
  const barHeight = Math.min(
    scaleFont(52, width),
    Math.round(
      (height * (isPortrait ? 0.44 : 0.52)) / Math.max(1, bars.length),
    ),
  );

  const headerProgress = interpolate(frame, [0, DURATION.normal], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASING.enter,
  });
  const subtitleProgress = interpolate(
    frame,
    [STAGGER.tight, STAGGER.tight + DURATION.normal],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASING.enter,
    },
  );
  const axisProgress = interpolate(
    frame,
    [STAGGER.normal, STAGGER.normal + DURATION.normal],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASING.enter,
    },
  );

  return (
    <div
      style={{
        width,
        height,
        background: backgroundColor,
        color: COLORS.ink,
        fontFamily,
        paddingLeft: safe.paddingLeft,
        paddingRight: safe.paddingRight,
        paddingTop: safe.paddingTop,
        paddingBottom: safe.paddingBottom,
        display: "flex",
        flexDirection: "column",
        // A tall frame has far more room than four rows need, so the whole
        // stack centres together instead of stranding the title at the top.
        justifyContent: isPortrait ? "center" : "flex-start",
        gap: scaleFont(40, width),
      }}
    >
      {title ? (
        <header style={{ display: "grid", gap: scaleFont(12, width) }}>
          <h2
            style={{
              margin: 0,
              fontSize: scaleFont(isPortrait ? 76 : 64, width),
              fontWeight: 700,
              lineHeight: 1.02,
              letterSpacing: "-0.025em",
              opacity: headerProgress,
              transform: `translateY(${(1 - headerProgress) * scaleFont(18, width)}px)`,
            }}
          >
            {title}
          </h2>
          {subtitle ? (
            <p
              style={{
                margin: 0,
                color: COLORS.label,
                fontSize: scaleFont(30, width),
                fontWeight: 500,
                lineHeight: 1.25,
                opacity: subtitleProgress,
                transform: `translateY(${(1 - subtitleProgress) * scaleFont(12, width)}px)`,
              }}
            >
              {subtitle}
            </p>
          ) : null}
        </header>
      ) : null}

      <div
        style={{
          flex: isPortrait ? "0 0 auto" : 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        {/* Gridlines are scoped to the rows so they never run on through the
            empty space a tall frame leaves above and below the chart. */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            gap: scaleFont(18, width),
          }}
        >
          {showAxis ? (
            <div
              style={{
                position: "absolute",
                left: labelWidth + gap,
                right: valueWidth + gap,
                top: 0,
                bottom: 0,
                opacity: axisProgress,
              }}
            >
              {domain.ticks.map((tick) => (
                <div
                  key={tick}
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: `${((tick - domain.min) / domain.span) * 100}%`,
                    width: 1,
                    background: COLORS.grid,
                  }}
                />
              ))}
            </div>
          ) : null}

          {bars.map((item, index) => {
            const delay = STAGGER.normal + index * STAGGER.normal;
            // One spring drives length, counter and row lift together.
            const enter = spring({
              frame: frame - delay,
              fps,
              config: { damping: 20, stiffness: 110, mass: 0.9 },
              durationInFrames: DURATION.slow,
            });
            const isHighlighted = highlightLabel === item.label;
            const fill = item.color ?? (isHighlighted ? accentColor : barColor);
            const ratio = Math.max(0, (item.value - domain.min) / domain.span);
            const delta = readDelta(item.delta);

            return (
              <div
                key={item.label}
                style={{
                  display: "grid",
                  gridTemplateColumns: `${labelWidth}px 1fr ${valueWidth}px`,
                  gap,
                  alignItems: "center",
                  opacity: Math.min(1, enter * 1.6),
                  transform: `translateY(${(1 - enter) * scaleFont(14, width)}px)`,
                }}
              >
                <div
                  style={{
                    color: isHighlighted ? COLORS.ink : COLORS.label,
                    fontSize: labelSize,
                    fontWeight: isHighlighted ? 700 : 600,
                    letterSpacing: "-0.01em",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.label}
                </div>

                <div
                  style={{
                    position: "relative",
                    height: barHeight,
                    borderRadius: barHeight / 2,
                    background: COLORS.track,
                  }}
                >
                  <div
                    style={{
                      // A floor keeps a near-zero bar visible as a pill, but it
                      // still grows from nothing rather than popping in at width.
                      width: `${Math.max(ratio, 0.015) * enter * 100}%`,
                      height: "100%",
                      borderRadius: barHeight / 2,
                      background: `linear-gradient(90deg, ${fill}e6 0%, ${fill} 62%)`,
                      boxShadow: isHighlighted
                        ? `0 0 ${scaleFont(28, width)}px ${fill}44`
                        : undefined,
                    }}
                  />
                </div>

                <div
                  style={{
                    display: "grid",
                    justifyItems: "end",
                    gap: scaleFont(4, width),
                  }}
                >
                  <div
                    style={{
                      fontSize: valueSize,
                      fontWeight: 700,
                      letterSpacing: "-0.02em",
                      lineHeight: 1,
                      fontVariantNumeric: "tabular-nums",
                      color: isHighlighted ? fill : COLORS.ink,
                    }}
                  >
                    {valueFormatter(item.value * enter)}
                  </div>
                  {delta.text ? (
                    <div
                      style={{
                        fontSize: scaleFont(21, width),
                        fontWeight: 600,
                        lineHeight: 1,
                        color:
                          delta.direction === "down"
                            ? COLORS.down
                            : delta.direction === "up"
                              ? COLORS.up
                              : COLORS.label,
                        opacity: interpolate(enter, [0.7, 1], [0, 1], {
                          extrapolateLeft: "clamp",
                          extrapolateRight: "clamp",
                        }),
                      }}
                    >
                      {delta.text}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {showAxis ? (
          <div
            style={{
              position: "relative",
              height: scaleFont(24, width),
              marginLeft: labelWidth + gap,
              marginRight: valueWidth + gap,
              marginTop: scaleFont(10, width),
              opacity: axisProgress,
            }}
          >
            {domain.ticks.map((tick, index) => (
              <div
                key={tick}
                style={{
                  position: "absolute",
                  top: 0,
                  left: `${((tick - domain.min) / domain.span) * 100}%`,
                  // End ticks pull inward so the axis never overhangs the plot.
                  transform:
                    index === 0
                      ? "none"
                      : index === domain.ticks.length - 1
                        ? "translateX(-100%)"
                        : "translateX(-50%)",
                  color: COLORS.axis,
                  fontSize: scaleFont(21, width),
                  fontWeight: 600,
                  fontVariantNumeric: "tabular-nums",
                  whiteSpace: "nowrap",
                }}
              >
                {formatAxisValue(tick)}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};
