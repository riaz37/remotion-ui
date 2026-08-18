import { interpolate, useCurrentFrame } from "remotion";
import { formatCompactNumber } from "@/remotion/lib/chart-utils";
import { EASING } from "@/remotion/lib/motion-tokens";

export type RaceSeries = {
  label: string;
  /** One value per keyframe. Every series must be the same length. */
  values: number[];
  color?: string;
};

export type BarChartRaceProps = {
  series: RaceSeries[];
  /** Keyframe labels, e.g. years. Shown as the running caption. */
  steps?: string[];
  /** Frames spent travelling between two keyframes. */
  framesPerStep?: number;
  /** How many rows are visible. Series ranked below this fade out. */
  visibleRows?: number;
  width?: number;
  rowHeight?: number;
  /** Space between rows. */
  gap?: number;
  colors?: string[];
  inkColor?: string;
  labelColor?: string;
  /** Width reserved for the row labels, left of the bars. */
  labelWidth?: number;
  /** Big step caption in the bottom-right corner. */
  showStepLabel?: boolean;
  valueFormatter?: (value: number) => string;
  delayInFrames?: number;
  /** Frame the exit begins on. Omit to hold on the final standings. */
  exitAtInFrames?: number;
  /** Length of the exit. */
  exitInFrames?: number;
  /** Frame override — pass the parent frame inside a `<Sequence>`. */
  frame?: number;
};

const DEFAULT_COLORS = [
  "#e8b86d",
  "#2dd4bf",
  "#f472b6",
  "#8b8bf5",
  "#f59e0b",
  "#5eead4",
];

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** Value of a series at a fractional keyframe position. */
function valueAt(values: number[], time: number): number {
  if (values.length === 0) return 0;
  const clamped = Math.min(values.length - 1, Math.max(0, time));
  const lower = Math.floor(clamped);
  const upper = Math.min(values.length - 1, lower + 1);
  const t = clamped - lower;
  return values[lower] + (values[upper] - values[lower]) * t;
}

/**
 * Ranked bars that overtake each other as the clock runs.
 *
 * Rank is computed as a *fractional* rank — each series counts how far above it
 * every other series sits, softened by a sigmoid — rather than an integer sort
 * position. An integer rank makes bars teleport a full row the instant two
 * values cross; the soft rank slides them past each other, which is the whole
 * point of the format.
 *
 * Distinct from `animated-bar-chart`, which reveals a single fixed ranking.
 */
export const BarChartRace: React.FC<BarChartRaceProps> = ({
  series,
  steps,
  framesPerStep = 26,
  visibleRows = 6,
  width = 900,
  rowHeight = 66,
  gap = 14,
  colors = DEFAULT_COLORS,
  inkColor = "#fafafa",
  labelColor = "rgba(250,250,250,0.55)",
  labelWidth = 200,
  showStepLabel = true,
  valueFormatter = (value: number) => formatCompactNumber(value),
  delayInFrames = 0,
  exitAtInFrames,
  exitInFrames = 20,
  frame: frameOverride,
}) => {
  const localFrame = useCurrentFrame();
  const frame = frameOverride ?? localFrame;

  const stepCount = series.reduce(
    (longest, entry) => Math.max(longest, entry.values.length),
    0,
  );
  const lastStep = Math.max(0, stepCount - 1);
  const time = Math.min(
    lastStep,
    Math.max(0, (frame - delayInFrames) / framesPerStep),
  );

  const current = series.map((entry, index) => ({
    ...entry,
    current: valueAt(entry.values, time),
    color: entry.color ?? colors[index % colors.length],
  }));

  const leader = current.reduce(
    (highest, entry) => Math.max(highest, entry.current),
    0,
  ) || 1;
  // The softening width is a share of the leader's value, so the crossover
  // reads the same whether the chart counts in tens or in millions.
  const softness = leader * 0.022;

  const exit =
    exitAtInFrames === undefined
      ? 0
      : interpolate(frame, [exitAtInFrames, exitAtInFrames + exitInFrames], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASING.exit,
        });

  const pitch = rowHeight + gap;
  const barWidth = width - labelWidth;
  const stepLabel = steps?.[Math.round(time)] ?? "";

  return (
    <div
      style={{
        position: "relative",
        width,
        height: pitch * visibleRows,
        opacity: 1 - clamp01(exit / 0.8),
      }}
    >
      {current.map((entry) => {
        const rank = current.reduce((sum, other) => {
          if (other.label === entry.label) return sum;
          return sum + 1 / (1 + Math.exp((entry.current - other.current) / softness));
        }, 0);

        // Rows past the visible window fade rather than clip, so a series
        // dropping off the board reads as losing rather than as a render bug.
        const visibility = clamp01(visibleRows - rank);
        if (visibility <= 0) return null;

        return (
          <div
            key={entry.label}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width,
              height: rowHeight,
              display: "flex",
              alignItems: "center",
              gap: gap,
              translate: `0 ${rank * pitch}px`,
              opacity: visibility,
            }}
          >
            <span
              style={{
                width: labelWidth - gap,
                textAlign: "right",
                color: labelColor,
                fontSize: rowHeight * 0.32,
                fontWeight: 600,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {entry.label}
            </span>

            <div
              style={{
                height: rowHeight,
                width: Math.max(
                  rowHeight * 0.6,
                  (entry.current / leader) * barWidth * (1 - exit),
                ),
                borderRadius: rowHeight * 0.22,
                background: entry.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                paddingRight: rowHeight * 0.28,
                boxSizing: "border-box",
              }}
            >
              <span
                style={{
                  color: "#0b0b10",
                  fontSize: rowHeight * 0.3,
                  fontWeight: 700,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {valueFormatter(entry.current)}
              </span>
            </div>
          </div>
        );
      })}

      {showStepLabel && stepLabel !== "" ? (
        <div
          style={{
            position: "absolute",
            right: 0,
            bottom: 0,
            color: inkColor,
            fontSize: rowHeight * 0.9,
            fontWeight: 700,
            opacity: 0.22,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {stepLabel}
        </div>
      ) : null}
    </div>
  );
};
