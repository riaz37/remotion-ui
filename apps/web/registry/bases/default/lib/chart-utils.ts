export type ChartDatum = {
  label: string;
  value: number;
  color?: string;
};

export type ChartPoint = {
  x: number;
  y: number;
  label?: string;
};

export function getChartDomain(values: number[]) {
  const min = Math.min(0, ...values);
  const max = Math.max(1, ...values);
  return { min, max, span: max - min || 1 };
}

export function scaleValue(value: number, min: number, max: number) {
  if (max === min) return 0;
  return (value - min) / (max - min);
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function normalizePoints(
  points: ChartPoint[],
  width: number,
  height: number,
  padding = 32,
) {
  const xDomain = getChartDomain(points.map((point) => point.x));
  const yDomain = getChartDomain(points.map((point) => point.y));
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  return points.map((point) => ({
    ...point,
    x: padding + scaleValue(point.x, xDomain.min, xDomain.max) * innerWidth,
    y:
      padding +
      (1 - scaleValue(point.y, yDomain.min, yDomain.max)) * innerHeight,
  }));
}

export function createLinePath(points: { x: number; y: number }[]): string {
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
}
