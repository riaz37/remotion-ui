import { useMemo } from "react";
import { interpolate, useCurrentFrame } from "remotion";
import {
  formatAxisValue,
  getPlotArea,
  niceDomain,
  scaleValue,
} from "@/remotion/lib/chart-utils";
import { EASING } from "@/remotion/lib/motion-tokens";

export type Candle = {
  open: number;
  high: number;
  low: number;
  close: number;
  /** Axis label for this candle. Usually only a few are labelled. */
  label?: string;
};

export type CandlestickChartProps = {
  candles: Candle[];
  width?: number;
  height?: number;
  upColor?: string;
  downColor?: string;
  gridColor?: string;
  labelColor?: string;
  /** Gridlines and price labels down the left gutter. */
  showAxis?: boolean;
  /** Moving average over this many candles. `0` hides the line. */
  movingAverage?: number;
  averageColor?: string;
  /** Last close, called out against the right edge. */
  showLastPrice?: boolean;
  valueFormatter?: (value: number) => string;
  /** Length of one candle's growth. */
  durationInFrames?: number;
  /** Frames between one candle and the next. */
  staggerInFrames?: number;
  delayInFrames?: number;
  /** Frame the exit begins on. Omit to hold once printed. */
  exitAtInFrames?: number;
  /** Length of the exit. */
  exitInFrames?: number;
  /** Frame override — pass the parent frame inside a `<Sequence>`. */
  frame?: number;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/**
 * OHLC candles printing left to right, with an optional moving average.
 *
 * Each candle grows out of its own open price in both directions rather than up
 * from the axis: the open is where the period started, so it is the only
 * anchor that leaves a half-drawn candle telling the truth. The wick grows on
 * the same clock, a little ahead of the body, which is how a real tape prints —
 * the extremes are known before the period closes.
 *
 * The average line trails the candles by a few frames rather than drawing after
 * all of them, so it reads as a running calculation over what is on screen.
 */
export const CandlestickChart: React.FC<CandlestickChartProps> = ({
  candles,
  width = 900,
  height = 460,
  upColor = "#2dd4bf",
  downColor = "#f472b6",
  gridColor = "rgba(250,250,250,0.10)",
  labelColor = "rgba(250,250,250,0.55)",
  showAxis = true,
  movingAverage = 7,
  averageColor = "#e8b86d",
  showLastPrice = true,
  valueFormatter = formatAxisValue,
  durationInFrames = 12,
  staggerInFrames = 3,
  delayInFrames = 0,
  exitAtInFrames,
  exitInFrames = 20,
  frame: frameOverride,
}) => {
  const localFrame = useCurrentFrame();
  const frame = frameOverride ?? localFrame;

  const unit = width / 960;
  const labelSize = Math.max(11, Math.round(21 * unit));

  /* Domain and the moving average are functions of the series, not of the
   * frame. Keyed on a signature of the series rather than on `candles`, because
   * a caller passing an array literal hands this a new reference every frame
   * and a reference-keyed memo would never hit. */
  const signature = candles
    .map((candle) => `${candle.open}/${candle.high}/${candle.low}/${candle.close}`)
    .join(",");

  const domain = useMemo(
    () =>
      niceDomain(candles.flatMap((candle) => [candle.high, candle.low]), {
        includeZero: false,
        tickCount: 4,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [signature],
  );

  const plot = getPlotArea(width, height, {
    top: labelSize,
    right: showLastPrice ? labelSize * 4.2 : labelSize,
    bottom: labelSize * 2.4,
    left: showAxis ? labelSize * 3.4 : labelSize,
  });

  const pitch = plot.width / Math.max(1, candles.length);
  const bodyWidth = Math.max(2, pitch * 0.62);
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

  const growth = (index: number, lead = 0) =>
    interpolate(
      frame,
      [
        delayInFrames + index * staggerInFrames - lead,
        delayInFrames + index * staggerInFrames + durationInFrames - lead,
      ],
      [0, 1],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASING.enter },
    );

  // Simple moving average, plotted only where a full window exists — a partial
  // window would draw an average of fewer candles than the legend claims.
  const averagePoints = useMemo(
    () =>
      movingAverage > 1
        ? candles
            .map((_, index) => {
              if (index < movingAverage - 1) return null;
              const window = candles.slice(index - movingAverage + 1, index + 1);
              const mean =
                window.reduce((sum, candle) => sum + candle.close, 0) /
                window.length;
              return { index, x: plot.left + pitch * (index + 0.5), y: y(mean) };
            })
            .filter((point): point is { index: number; x: number; y: number } =>
              Boolean(point),
            )
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [signature, movingAverage, plot.left, plot.bottom, plot.height, pitch, domain],
  );

  const lastCandle = candles[candles.length - 1];
  const lastVisible = growth(candles.length - 1);

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

      {candles.map((candle, index) => {
        const body = growth(index);
        const wick = growth(index, durationInFrames * 0.35);
        // Candles clear from the left, oldest first.
        const drain = clamp01(
          (exit - (index / Math.max(1, candles.length)) * 0.35) / 0.65,
        );
        const shown = clamp01(body) * (1 - drain);
        if (shown <= 0) return null;

        const centre = plot.left + pitch * (index + 0.5);
        const openY = y(candle.open);
        const closeY = openY + (y(candle.close) - openY) * shown;
        const highY = openY + (y(candle.high) - openY) * clamp01(wick) * (1 - drain);
        const lowY = openY + (y(candle.low) - openY) * clamp01(wick) * (1 - drain);
        const rising = candle.close >= candle.open;
        const colour = rising ? upColor : downColor;

        return (
          <g key={index}>
            <line
              x1={centre}
              y1={highY}
              x2={centre}
              y2={lowY}
              stroke={colour}
              strokeWidth={Math.max(1, bodyWidth * 0.16)}
              opacity={0.85}
            />
            <rect
              x={centre - bodyWidth / 2}
              y={Math.min(openY, closeY)}
              width={bodyWidth}
              // A doji — open equal to close — still needs a visible mark.
              height={Math.max(Math.max(1, bodyWidth * 0.1), Math.abs(closeY - openY))}
              fill={colour}
              rx={Math.min(2, bodyWidth * 0.15)}
            />
            {candle.label ? (
              <text
                x={centre}
                y={plot.bottom + labelSize * 1.2}
                fill={labelColor}
                fontSize={labelSize * 0.9}
                fontWeight={600}
                textAnchor="middle"
                dominantBaseline="central"
                opacity={clamp01(body * 1.4) * (1 - drain)}
              >
                {candle.label}
              </text>
            ) : null}
          </g>
        );
      })}

      {averagePoints.length > 1
        ? averagePoints.slice(1).map((point, segment) => {
            const previous = averagePoints[segment];
            const reach = clamp01(growth(point.index, -durationInFrames * 0.5));
            const drain = clamp01(
              (exit - (point.index / Math.max(1, candles.length)) * 0.35) / 0.65,
            );
            const shown = reach * (1 - drain);
            if (shown <= 0) return null;

            return (
              <line
                key={point.index}
                x1={previous.x}
                y1={previous.y}
                x2={previous.x + (point.x - previous.x) * shown}
                y2={previous.y + (point.y - previous.y) * shown}
                stroke={averageColor}
                strokeWidth={Math.max(2, 3 * unit)}
                strokeLinecap="round"
                opacity={0.9}
              />
            );
          })
        : null}

      {showLastPrice && lastCandle ? (
        <g opacity={clamp01((lastVisible - 0.6) / 0.4) * (1 - clamp01(exit / 0.6))}>
          <line
            x1={plot.left}
            y1={y(lastCandle.close)}
            x2={plot.right}
            y2={y(lastCandle.close)}
            stroke={lastCandle.close >= lastCandle.open ? upColor : downColor}
            strokeWidth={1.5}
            strokeDasharray={`${5 * unit} ${5 * unit}`}
            opacity={0.6}
          />
          <rect
            x={plot.right + labelSize * 0.3}
            y={y(lastCandle.close) - labelSize * 0.85}
            width={labelSize * 3.6}
            height={labelSize * 1.7}
            rx={labelSize * 0.4}
            fill={lastCandle.close >= lastCandle.open ? upColor : downColor}
          />
          <text
            x={plot.right + labelSize * 2.1}
            y={y(lastCandle.close)}
            fill="#0b0b10"
            fontSize={labelSize}
            fontWeight={700}
            textAnchor="middle"
            dominantBaseline="central"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {valueFormatter(lastCandle.close)}
          </text>
        </g>
      ) : null}
    </svg>
  );
};
