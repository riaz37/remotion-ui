import { interpolateColors } from "remotion";
import { bandEnergy, useAudioBands } from "@/remotion/lib/audio-viz-utils";

export type BeatPulseGridProps = {
  /** Audio source. `.wav` — `useWindowedAudioData` accepts nothing else. */
  src: string;
  columns?: number;
  rows?: number;
  /** Cell edge length in px. */
  cellSize?: number;
  gap?: number;
  cornerRadius?: number;
  /** Cell colour at rest. */
  idleColor?: string;
  /** Cell colour at full level. */
  color?: string;
  /** Colour of the cells carrying the loudest band. */
  peakColor?: string;
  /**
   * Which band drives a cell. `column` maps the spectrum left to right;
   * `radial` maps it outward from the centre.
   */
  mapping?: "column" | "radial" | "row";
  /** Extra scale a cell takes at full level. */
  pulseScale?: number;
  /** Level below which a cell stays dark. Cuts the noise floor. */
  floor?: number;
  /**
   * Optional frame override.
   * Pass a parent `frame` when using inside `<Sequence from={...}>`.
   */
  frame?: number;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/**
 * A grid of cells pulsing with the track.
 *
 * Each cell is bound to a band rather than to the overall level: a grid where
 * every cell does the same thing is one big flashing rectangle, and the point
 * of a grid is that different parts of it can disagree. `mapping` decides how
 * the spectrum is laid over the geometry — left to right, or outward from the
 * centre, which reads as a pulse travelling through the grid on the kick.
 *
 * Cells also carry their band's *peak*, dimmed, under the live level. It is the
 * same trick as a peak-hold meter: at 30fps a one-frame transient is invisible,
 * and the decaying trace is what makes the beat legible.
 */
export const BeatPulseGrid: React.FC<BeatPulseGridProps> = ({
  src,
  columns = 12,
  rows = 6,
  cellSize = 34,
  gap = 8,
  cornerRadius = 8,
  idleColor = "rgba(250,250,250,0.07)",
  color = "#e8b86d",
  peakColor = "#f472b6",
  mapping = "radial",
  pulseScale = 0.28,
  floor = 0.06,
  frame: frameOverride,
}) => {
  const bandCount =
    mapping === "row" ? rows : mapping === "column" ? columns : Math.max(columns, rows);
  const { bands, peaks } = useAudioBands({
    src,
    bandCount,
    frame: frameOverride,
  });

  const kick = clamp01(bandEnergy(bands, 0, Math.max(1, Math.round(bandCount / 4))));
  const centreX = (columns - 1) / 2;
  const centreY = (rows - 1) / 2;
  const maxDistance = Math.hypot(centreX, centreY) || 1;

  const bandFor = (column: number, row: number) => {
    if (mapping === "column") return column;
    if (mapping === "row") return row;
    const distance = Math.hypot(column - centreX, row - centreY) / maxDistance;
    return Math.round(distance * (bands.length - 1));
  };

  return (
    <div style={{ display: "grid", gap, gridAutoFlow: "row" }}>
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} style={{ display: "flex", gap }}>
          {Array.from({ length: columns }, (_, column) => {
            const index = bandFor(column, row) % bands.length;
            const level = clamp01(((bands[index] ?? 0) - floor) / (1 - floor));
            const peak = clamp01(((peaks[index] ?? 0) - floor) / (1 - floor));
            // The peak trace never exceeds the live level's brightness; it only
            // keeps a cell warm after the transient that lit it has gone.
            const trace = Math.max(level, peak * 0.55);

            return (
              <div
                key={column}
                style={{
                  width: cellSize,
                  height: cellSize,
                  borderRadius: cornerRadius,
                  background: interpolateColors(
                    trace,
                    [0, 0.75, 1],
                    [idleColor, color, peakColor],
                  ),
                  scale: `${1 + pulseScale * level}`,
                  // The kick lifts the whole grid a little, which is what makes
                  // the pattern read as one instrument rather than many.
                  opacity: 0.55 + trace * 0.45 + kick * 0.08,
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};
