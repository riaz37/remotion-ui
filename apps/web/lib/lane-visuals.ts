import type { AtlasLane } from "./atlas";

export type LaneVisual = {
  label: string;
  hue: number;
  /** SVG path for 24×24 icon */
  iconPath: string;
};

export const LANE_VISUALS: Record<AtlasLane, LaneVisual> = {
  atoms: {
    label: "Atoms",
    hue: 252,
    iconPath:
      "M4 12h4M16 12h4M12 4v4M12 16v4M8 8l2.8 2.8M13.2 13.2L16 16M16 8l-2.8 2.8M10.8 13.2L8 16",
  },
  signals: {
    label: "Signals",
    hue: 285,
    iconPath: "M4 14c3-6 5-6 8 0s5 6 8 0",
  },
  vectors: {
    label: "Vectors",
    hue: 195,
    iconPath: "M5 18c6-14 10-14 14 0",
  },
  spatial: {
    label: "Spatial",
    hue: 155,
    iconPath: "M12 4c-4 6-4 10 0 16 4-6 4-10 0-16z",
  },
  blocks: {
    label: "Blocks",
    hue: 48,
    iconPath: "M5 5h8v8H5zM11 11h8v8h-8z",
  },
  cuts: {
    label: "Cuts",
    hue: 25,
    iconPath: "M6 6l12 12M18 6L6 18",
  },
  reels: {
    label: "Reels",
    hue: 330,
    iconPath: "M6 8h12v8H6zM9 10v4M15 10v4",
  },
};

export function laneAccent(lane: AtlasLane): string {
  const { hue } = LANE_VISUALS[lane];
  return `oklch(0.62 0.14 ${hue})`;
}

export function laneAccentMuted(lane: AtlasLane): string {
  const { hue } = LANE_VISUALS[lane];
  return `oklch(0.22 0.04 ${hue})`;
}
