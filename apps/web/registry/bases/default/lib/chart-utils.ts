/**
 * Chart maths for the charts & metrics layer.
 *
 * Everything here is pure and frame-independent — components own the timing,
 * this file owns the geometry. Screen coordinates are produced in one place so
 * a line, its area fill, its gridlines and its axis labels can never drift out
 * of alignment with each other.
 */

export type ChartDatum = {
  label: string;
  value: number;
  /** Overrides the series colour for this bar/point. */
  color?: string;
  /** Short change annotation, e.g. `"+18%"`. */
  delta?: string;
};

export type ChartPoint = {
  x: number;
  y: number;
  /** Axis tick label. Falls back to the x value when omitted. */
  label?: string;
};

export type ChartDomain = {
  min: number;
  max: number;
  span: number;
};

/** Inner drawing rectangle, in SVG user units. */
export type PlotArea = {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
};

export type PlotInsets = {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
};

/** A point projected into plot coordinates, with its source values kept. */
export type PlottedPoint = {
  x: number;
  y: number;
  value: number;
  label?: string;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** Raw min/max of a series. `includeZero` anchors bar charts to a true zero. */
export function getChartDomain(
  values: number[],
  { includeZero = false }: { includeZero?: boolean } = {},
): ChartDomain {
  const finite = values.filter((value) => Number.isFinite(value));

  if (finite.length === 0) {
    return { min: 0, max: 1, span: 1 };
  }

  const min = Math.min(...finite, includeZero ? 0 : Infinity);
  const max = Math.max(...finite, includeZero ? 0 : -Infinity);

  // A flat series still needs a span, otherwise every point lands on one line.
  if (min === max) {
    const padding = Math.abs(max) || 1;
    return { min: min - padding, max: max + padding, span: padding * 2 };
  }

  return { min, max, span: max - min };
}

/** Rounds a raw step up to the nearest 1 / 2 / 5 × 10ⁿ so ticks read cleanly. */
function niceStep(rawStep: number): number {
  if (rawStep <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalized = rawStep / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

/**
 * Domain snapped outward to round numbers, with the tick values that land
 * inside it. Charts read as measured rather than arbitrary when the axis stops
 * at 60K instead of 58.4K.
 */
export function niceDomain(
  values: number[],
  {
    includeZero = true,
    tickCount = 4,
  }: { includeZero?: boolean; tickCount?: number } = {},
): ChartDomain & { ticks: number[] } {
  const raw = getChartDomain(values, { includeZero });
  const step = niceStep(raw.span / Math.max(1, tickCount));
  const min = Math.floor(raw.min / step) * step;
  const max = Math.ceil(raw.max / step) * step;
  const ticks: number[] = [];

  // Float steps accumulate error, so walk an integer index instead.
  for (let index = 0; min + index * step <= max + step * 1e-6; index += 1) {
    ticks.push(Number((min + index * step).toPrecision(12)));
  }

  return { min, max, span: max - min || 1, ticks };
}

/** Normalized 0→1 position of a value inside a domain. */
export function scaleValue(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return (value - min) / (max - min);
}

/**
 * Inner rectangle of a chart. Insets are per-edge because the left gutter has
 * to hold axis labels while the right edge only needs room for the line cap.
 */
export function getPlotArea(
  width: number,
  height: number,
  insets: PlotInsets = {},
): PlotArea {
  const top = insets.top ?? 24;
  const right = insets.right ?? 24;
  const bottom = insets.bottom ?? 24;
  const left = insets.left ?? 24;

  return {
    left,
    top,
    right: width - right,
    bottom: height - bottom,
    width: Math.max(1, width - left - right),
    height: Math.max(1, height - top - bottom),
  };
}

/**
 * Projects data points into plot coordinates.
 *
 * The x domain is the index range rather than the x values when points are
 * evenly spaced categories — pass real x values and they are honoured.
 */
export function plotPoints(
  points: ChartPoint[],
  plot: PlotArea,
  yDomain: ChartDomain,
): PlottedPoint[] {
  const xDomain = getChartDomain(points.map((point) => point.x));

  return points.map((point) => ({
    x: plot.left + scaleValue(point.x, xDomain.min, xDomain.max) * plot.width,
    y:
      plot.bottom -
      clamp01(scaleValue(point.y, yDomain.min, yDomain.max)) * plot.height,
    value: point.y,
    label: point.label,
  }));
}

/** Straight polyline through the projected points. */
export function buildLinePath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${round(point.x)} ${round(point.y)}`)
    .join(" ");
}

/**
 * Cardinal spline through the points, with control points clamped inside each
 * segment's own y range. Unclamped splines overshoot past local minima, which
 * on a chart reads as data that was never in the series.
 */
export function buildSmoothPath(
  points: { x: number; y: number }[],
  tension = 0.42,
): string {
  if (points.length < 3) return buildLinePath(points);

  const parts = [`M ${round(points[0].x)} ${round(points[0].y)}`];

  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = points[index - 1] ?? points[index];
    const current = points[index];
    const next = points[index + 1];
    const after = points[index + 2] ?? next;

    const lowerBound = Math.min(current.y, next.y);
    const upperBound = Math.max(current.y, next.y);
    const clampY = (value: number) =>
      Math.min(upperBound, Math.max(lowerBound, value));

    const c1x = current.x + ((next.x - previous.x) / 6) * tension * 2;
    const c1y = clampY(current.y + ((next.y - previous.y) / 6) * tension * 2);
    const c2x = next.x - ((after.x - current.x) / 6) * tension * 2;
    const c2y = clampY(next.y - ((after.y - current.y) / 6) * tension * 2);

    parts.push(
      `C ${round(c1x)} ${round(c1y)}, ${round(c2x)} ${round(c2y)}, ${round(next.x)} ${round(next.y)}`,
    );
  }

  return parts.join(" ");
}

/** Closes a line path down to a baseline so it can be filled. */
export function buildAreaPath(
  linePath: string,
  points: { x: number; y: number }[],
  baselineY: number,
): string {
  if (points.length === 0 || linePath === "") return "";
  const first = points[0];
  const last = points[points.length - 1];
  return `${linePath} L ${round(last.x)} ${round(baselineY)} L ${round(first.x)} ${round(baselineY)} Z`;
}

/** `124000` → `"124K"`. The default label format across the chart layer. */
export function formatCompactNumber(
  value: number,
  maximumFractionDigits = 1,
): string {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits,
  }).format(value);
}

/**
 * Axis ticks drop the fraction that `formatCompactNumber` keeps — an axis
 * reading 0 / 30K / 60K is quieter than 0 / 30.0K / 60.0K.
 */
export function formatAxisValue(value: number): string {
  return formatCompactNumber(value, Math.abs(value) < 10 ? 1 : 0);
}

/**
 * Splits a delta string into its direction and text so callers can colour it.
 * Anything that is not clearly signed stays neutral rather than guessing.
 */
export function readDelta(delta: string | undefined): {
  direction: "up" | "down" | "flat";
  text: string;
} {
  if (!delta) return { direction: "flat", text: "" };
  const trimmed = delta.trim();
  if (trimmed.startsWith("+")) return { direction: "up", text: trimmed };
  if (trimmed.startsWith("-") || trimmed.startsWith("−")) {
    return { direction: "down", text: trimmed };
  }
  return { direction: "flat", text: trimmed };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
