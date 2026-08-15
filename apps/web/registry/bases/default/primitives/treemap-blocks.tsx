import { interpolate, useCurrentFrame } from "remotion";
import {
  formatCompactNumber,
  type ChartDatum,
} from "@/remotion/lib/chart-utils";
import { EASING } from "@/remotion/lib/motion-tokens";

export type TreemapBlocksProps = {
  blocks: ChartDatum[];
  width?: number;
  height?: number;
  colors?: string[];
  /** Space between blocks, in px. */
  gap?: number;
  cornerRadius?: number;
  inkColor?: string;
  /** Share of the total printed under the value. */
  showShare?: boolean;
  valueFormatter?: (value: number) => string;
  /** Length of one block's arrival. */
  durationInFrames?: number;
  /** Frames between one block and the next, largest first. */
  staggerInFrames?: number;
  delayInFrames?: number;
  /** Frame the exit begins on. Omit to hold once laid out. */
  exitAtInFrames?: number;
  /** Length of the exit. */
  exitInFrames?: number;
  /** Frame override — pass the parent frame inside a `<Sequence>`. */
  frame?: number;
};

const DEFAULT_COLORS = ["#e8b86d", "#2dd4bf", "#f472b6", "#8b8bf5", "#f59e0b"];

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

type Tile = { x: number; y: number; width: number; height: number; index: number };
type Free = { x: number; y: number; width: number; height: number };

/** Worst aspect ratio in a row laid along `side`, given its total area. */
function worstRatio(areas: number[], side: number, total: number): number {
  if (areas.length === 0 || side === 0 || total === 0) return Infinity;
  const max = Math.max(...areas);
  const min = Math.min(...areas);
  return Math.max(
    (side * side * max) / (total * total),
    (total * total) / (side * side * min),
  );
}

/**
 * Squarified treemap layout (Bruls, Huizing & van Wijk).
 *
 * Rows are grown along the shorter side of what is left, and a row closes as
 * soon as adding the next value would make its worst aspect ratio worse. Naive
 * slice-and-dice layouts produce long splinters for small values, which are
 * impossible to label and misread badly at a glance — the squarified rule keeps
 * every tile near square, which is the only reason a treemap is legible.
 */
function squarify(values: number[], width: number, height: number): Tile[] {
  const total = values.reduce((sum, value) => sum + value, 0);
  if (total <= 0 || width <= 0 || height <= 0) return [];

  const order = values
    .map((value, index) => ({ value, index }))
    .sort((a, b) => b.value - a.value);

  // Values are converted to areas up front so the layout is pure geometry.
  const scale = (width * height) / total;
  const tiles: Tile[] = [];
  let free: Free = { x: 0, y: 0, width, height };
  let row: { area: number; index: number }[] = [];

  const flushRow = () => {
    if (row.length === 0) return;
    const rowArea = row.reduce((sum, entry) => sum + entry.area, 0);
    const horizontal = free.width >= free.height;
    const thickness = rowArea / (horizontal ? free.height : free.width);

    let offset = 0;
    for (const entry of row) {
      const length = entry.area / thickness;
      tiles.push(
        horizontal
          ? {
              x: free.x,
              y: free.y + offset,
              width: thickness,
              height: length,
              index: entry.index,
            }
          : {
              x: free.x + offset,
              y: free.y,
              width: length,
              height: thickness,
              index: entry.index,
            },
      );
      offset += length;
    }

    free = horizontal
      ? {
          x: free.x + thickness,
          y: free.y,
          width: free.width - thickness,
          height: free.height,
        }
      : {
          x: free.x,
          y: free.y + thickness,
          width: free.width,
          height: free.height - thickness,
        };
    row = [];
  };

  for (const entry of order) {
    const area = entry.value * scale;
    const side = Math.min(free.width, free.height);
    const current = row.map((item) => item.area);
    const currentTotal = current.reduce((sum, value) => sum + value, 0);

    const before = worstRatio(current, side, currentTotal);
    const after = worstRatio([...current, area], side, currentTotal + area);

    if (row.length > 0 && after > before) {
      flushRow();
    }

    row.push({ area, index: entry.index });
  }

  flushRow();
  return tiles;
}

/**
 * Value blocks laid out as a treemap, arriving largest first.
 *
 * Area is the whole message here, so the layout is squarified rather than
 * sliced: every tile stays close to square and its size is directly comparable
 * to its neighbours'. Blocks scale up from their own centres in descending
 * order, which builds the map from its dominant value outward.
 */
export const TreemapBlocks: React.FC<TreemapBlocksProps> = ({
  blocks,
  width = 820,
  height = 460,
  colors = DEFAULT_COLORS,
  gap = 8,
  cornerRadius = 12,
  inkColor = "#0b0b10",
  showShare = true,
  valueFormatter = (value: number) => formatCompactNumber(value),
  durationInFrames = 20,
  staggerInFrames = 6,
  delayInFrames = 0,
  exitAtInFrames,
  exitInFrames = 20,
  frame: frameOverride,
}) => {
  const localFrame = useCurrentFrame();
  const frame = frameOverride ?? localFrame;

  const total = blocks.reduce((sum, block) => sum + block.value, 0) || 1;
  const tiles = squarify(
    blocks.map((block) => block.value),
    width,
    height,
  );

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
      {tiles.map((tile, rank) => {
        const datum = blocks[tile.index];
        const start = delayInFrames + rank * staggerInFrames;
        const progress = interpolate(
          frame,
          [start, start + durationInFrames],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASING.enter },
        );
        // Smallest blocks leave first, so the map collapses onto its dominant
        // value rather than dissolving as one sheet.
        const drain = clamp01(
          (exit - (1 - rank / Math.max(1, tiles.length)) * 0.25) / 0.75,
        );
        const shown = clamp01(progress) * (1 - drain);
        if (shown <= 0) return null;

        const innerWidth = Math.max(0, tile.width - gap) * shown;
        const innerHeight = Math.max(0, tile.height - gap) * shown;
        const x = tile.x + gap / 2 + (Math.max(0, tile.width - gap) - innerWidth) / 2;
        const y = tile.y + gap / 2 + (Math.max(0, tile.height - gap) - innerHeight) / 2;

        const labelSize = Math.min(innerWidth * 0.16, innerHeight * 0.2, 34);
        const fits = labelSize > 9 && innerWidth > labelSize * 3;

        return (
          <g key={datum.label}>
            <rect
              x={x}
              y={y}
              width={innerWidth}
              height={innerHeight}
              rx={Math.min(cornerRadius, innerWidth / 2, innerHeight / 2)}
              fill={datum.color ?? colors[tile.index % colors.length]}
              opacity={0.92}
            />
            {fits ? (
              <text
                x={x + labelSize * 0.6}
                y={y + labelSize * 1.1}
                fill={inkColor}
                fontSize={labelSize}
                fontWeight={700}
                dominantBaseline="central"
                opacity={clamp01((shown - 0.6) / 0.4)}
              >
                {datum.label}
              </text>
            ) : null}
            {fits && innerHeight > labelSize * 3 ? (
              <text
                x={x + labelSize * 0.6}
                y={y + labelSize * 2.4}
                fill={inkColor}
                fontSize={labelSize * 0.82}
                fontWeight={600}
                dominantBaseline="central"
                opacity={clamp01((shown - 0.7) / 0.3) * 0.72}
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {valueFormatter(datum.value)}
                {showShare ? ` · ${Math.round((datum.value / total) * 100)}%` : ""}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
};
