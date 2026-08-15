import { interpolate, useCurrentFrame } from "remotion";
import {
  formatCompactNumber,
  getPlotArea,
  niceDomain,
  scaleValue,
} from "@/remotion/lib/chart-utils";
import { EASING } from "@/remotion/lib/motion-tokens";

export type WaterfallStep = {
  label: string;
  /** Signed change, or the absolute value when `isTotal` is set. */
  value: number;
  /** Draws this step from zero as a subtotal rather than as a change. */
  isTotal?: boolean;
  color?: string;
};

export type WaterfallChartProps = {
  steps: WaterfallStep[];
  width?: number;
  height?: number;
  upColor?: string;
  downColor?: string;
  totalColor?: string;
  gridColor?: string;
  labelColor?: string;
  inkColor?: string;
  /** Dashed connectors between the top of one bar and the base of the next. */
  showConnectors?: boolean;
  /** Signed change printed above or below each bar. */
  showValues?: boolean;
  /** Gridlines and value labels down the left gutter. */
  showAxis?: boolean;
  valueFormatter?: (value: number) => string;
  /** Length of one bar's growth. */
  durationInFrames?: number;
  /** Frames between one step and the next. */
  staggerInFrames?: number;
  delayInFrames?: number;
  /** Frame the exit begins on. Omit to hold once built. */
  exitAtInFrames?: number;
  /** Length of the exit. */
  exitInFrames?: number;
  /** Frame override — pass the parent frame inside a `<Sequence>`. */
  frame?: number;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/**
 * A bridge chart: floating bars carrying a running total from one figure to
 * another.
 *
 * Each bar grows *from the running total it starts at*, not from the axis, so
 * the bar's base is the previous step's result and its height is the change.
 * That is what separates a waterfall from a bar chart — the position carries as
 * much information as the length, and growing every bar from zero would throw
 * the position away.
 *
 * Steps marked `isTotal` are drawn from the axis instead, and reset the running
 * total to their own value, which is how a subtotal column stays honest.
 */
export const WaterfallChart: React.FC<WaterfallChartProps> = ({
  steps,
  width = 860,
  height = 440,
  upColor = "#2dd4bf",
  downColor = "#f472b6",
  totalColor = "#e8b86d",
  gridColor = "rgba(250,250,250,0.10)",
  labelColor = "rgba(250,250,250,0.55)",
  inkColor = "#fafafa",
  showConnectors = true,
  showValues = true,
  showAxis = true,
  valueFormatter = (value: number) => formatCompactNumber(value),
  durationInFrames = 20,
  staggerInFrames = 10,
  delayInFrames = 0,
  exitAtInFrames,
  exitInFrames = 20,
  frame: frameOverride,
}) => {
  const localFrame = useCurrentFrame();
  const frame = frameOverride ?? localFrame;

  const unit = width / 960;
  const labelSize = Math.max(11, Math.round(21 * unit));

  // The running total is resolved once, up front: every bar needs to know both
  // the level it starts at and the level it lands on before anything is drawn.
  let running = 0;
  const resolved = steps.map((step) => {
    const from = step.isTotal ? 0 : running;
    const to = step.isTotal ? step.value : running + step.value;
    running = to;
    return { ...step, from, to };
  });

  const levels = resolved.flatMap((step) => [step.from, step.to]);
  const domain = niceDomain(levels, { includeZero: true, tickCount: 4 });

  const plot = getPlotArea(width, height, {
    top: labelSize * 2,
    right: labelSize,
    bottom: labelSize * 3,
    left: showAxis ? labelSize * 3.6 : labelSize,
  });

  const pitch = plot.width / Math.max(1, resolved.length);
  const barWidth = pitch * 0.62;
  const y = (value: number) =>
    plot.bottom - scaleValue(value, domain.min, domain.max) * plot.height;

  const exit =
    exitAtInFrames === undefined
      ? 0
      : interpolate(frame, [exitAtInFrames, exitAtInFrames + exitInFrames], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASING.exit,
        });

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {showAxis
        ? domain.ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={plot.left}
                y1={y(tick)}
                x2={plot.right}
                y2={y(tick)}
                stroke={gridColor}
                strokeWidth={1}
                opacity={tick === 0 ? 2 : 1}
              />
              <text
                x={plot.left - labelSize * 0.6}
                y={y(tick)}
                fill={labelColor}
                fontSize={labelSize}
                fontWeight={600}
                textAnchor="end"
                dominantBaseline="central"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {valueFormatter(tick)}
              </text>
            </g>
          ))
        : null}

      {resolved.map((step, index) => {
        const start = delayInFrames + index * staggerInFrames;
        const progress = interpolate(
          frame,
          [start, start + durationInFrames],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASING.enter },
        );
        const drain = clamp01((exit - index * 0.04) / 0.7);
        const shown = clamp01(progress) * (1 - drain);
        if (shown <= 0) return null;

        const centre = plot.left + pitch * (index + 0.5);
        const base = y(step.from);
        const tip = base + (y(step.to) - base) * shown;
        const top = Math.min(base, tip);
        const barHeight = Math.abs(tip - base);
        const rising = step.to >= step.from;
        const colour =
          step.color ?? (step.isTotal ? totalColor : rising ? upColor : downColor);

        // The connector leaves from the level this step lands on and waits for
        // the bar to finish, so it never points at a level that is still moving.
        const connectorProgress = clamp01((progress - 0.85) / 0.15);
        const nextCentre = plot.left + pitch * (index + 1.5);

        return (
          <g key={step.label}>
            <rect
              x={centre - barWidth / 2}
              y={top}
              width={barWidth}
              height={Math.max(1, barHeight)}
              rx={Math.min(barWidth * 0.1, 6)}
              fill={colour}
              opacity={0.94}
            />

            {showConnectors && index < resolved.length - 1 && !resolved[index + 1].isTotal ? (
              <line
                x1={centre + barWidth / 2}
                y1={y(step.to)}
                x2={
                  centre +
                  barWidth / 2 +
                  (nextCentre - barWidth / 2 - (centre + barWidth / 2)) *
                    connectorProgress
                }
                y2={y(step.to)}
                stroke={labelColor}
                strokeWidth={1.5}
                strokeDasharray={`${6 * unit} ${5 * unit}`}
                opacity={0.7 * (1 - clamp01(exit / 0.6))}
              />
            ) : null}

            {showValues ? (
              <text
                x={centre}
                y={rising ? top - labelSize * 0.7 : top + barHeight + labelSize * 0.7}
                fill={step.isTotal ? inkColor : colour}
                fontSize={labelSize}
                fontWeight={700}
                textAnchor="middle"
                dominantBaseline="central"
                opacity={clamp01((progress - 0.7) / 0.3) * (1 - drain)}
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {step.isTotal
                  ? valueFormatter(step.value)
                  : `${step.value >= 0 ? "+" : "−"}${valueFormatter(Math.abs(step.value))}`}
              </text>
            ) : null}

            <text
              x={centre}
              y={plot.bottom + labelSize * 1.3}
              fill={labelColor}
              fontSize={labelSize}
              fontWeight={600}
              textAnchor="middle"
              dominantBaseline="central"
              opacity={clamp01(progress * 1.5) * (1 - drain)}
            >
              {step.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};
