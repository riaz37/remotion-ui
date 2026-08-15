import { interpolate, useCurrentFrame } from "remotion";
import { formatCompactNumber } from "@/remotion/lib/chart-utils";
import { EASING } from "@/remotion/lib/motion-tokens";

export type FunnelStage = {
  label: string;
  value: number;
  color?: string;
};

export type FunnelChartProps = {
  /** Stages top to bottom. Values are expected to fall, but need not. */
  stages: FunnelStage[];
  width?: number;
  height?: number;
  /** Space between stage bands, in px. */
  gap?: number;
  color?: string;
  /** Opacity of the last band. Earlier bands ramp up toward 1. */
  tailOpacity?: number;
  inkColor?: string;
  labelColor?: string;
  /** Width of the left gutter that holds the stage names and values. */
  labelWidth?: number;
  /** Drop-off percentage printed between consecutive stages. */
  showDropoff?: boolean;
  dropoffColor?: string;
  /** Share of the first stage that reached this one, printed beside the value. */
  showConversion?: boolean;
  valueFormatter?: (value: number) => string;
  /** Length of one band's wipe. */
  durationInFrames?: number;
  /** Frames between one band and the next. */
  staggerInFrames?: number;
  delayInFrames?: number;
  /** Frame the exit begins on. Omit to hold once complete. */
  exitAtInFrames?: number;
  /** Length of the exit. */
  exitInFrames?: number;
  /** Frame override — pass the parent frame inside a `<Sequence>`. */
  frame?: number;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/**
 * Stage bands narrowing toward the bottom, with the drop-off between them.
 *
 * Each band is a trapezoid running from its own width down to the *next*
 * stage's width, so the taper itself is the loss — the shape carries the number
 * before anyone reads a label. The final band is a rectangle: there is no next
 * stage to taper to, and inventing one would overstate the last step.
 *
 * Names and values live in a left gutter rather than inside the bands. A real
 * funnel ends narrow, and type set inside the last band would either overflow
 * it or have to shrink until it was unreadable — which is exactly where the
 * interesting number usually is.
 *
 * Bands wipe downward in order, and each drop-off chip waits for the band below
 * it: the chip is a conclusion about two stages, so it cannot land before both
 * exist.
 */
export const FunnelChart: React.FC<FunnelChartProps> = ({
  stages,
  width = 820,
  height = 420,
  gap = 10,
  color = "#e8b86d",
  tailOpacity = 0.5,
  inkColor = "#fafafa",
  labelColor = "rgba(250,250,250,0.55)",
  labelWidth,
  showDropoff = true,
  dropoffColor = "#f472b6",
  showConversion = false,
  valueFormatter = (value: number) => formatCompactNumber(value),
  durationInFrames = 22,
  staggerInFrames = 12,
  delayInFrames = 0,
  exitAtInFrames,
  exitInFrames = 20,
  frame: frameOverride,
}) => {
  const localFrame = useCurrentFrame();
  const frame = frameOverride ?? localFrame;

  const count = Math.max(1, stages.length);
  const peak = stages.reduce((highest, stage) => Math.max(highest, stage.value), 0) || 1;
  const bandHeight = (height - gap * (count - 1)) / count;
  const labelSize = Math.max(12, Math.min(bandHeight * 0.34, width * 0.028));

  const gutter = labelWidth ?? width * 0.3;
  const dropoffGutter = showDropoff ? width * 0.13 : 0;
  const funnelWidth = width - gutter - dropoffGutter;
  const centre = gutter + funnelWidth / 2;

  const exit =
    exitAtInFrames === undefined
      ? 0
      : interpolate(frame, [exitAtInFrames, exitAtInFrames + exitInFrames], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASING.exit,
        });

  const bandWidth = (value: number) => (value / peak) * funnelWidth;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {stages.map((stage, index) => {
        const top = index * (bandHeight + gap);
        const bottom = top + bandHeight;
        const topWidth = bandWidth(stage.value);
        const next = stages[index + 1];
        const bottomWidth = next ? bandWidth(next.value) : topWidth;

        const start = delayInFrames + index * staggerInFrames;
        const progress = interpolate(
          frame,
          [start, start + durationInFrames],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASING.enter },
        );
        // Bands leave bottom-up, so the funnel drains from its narrow end.
        const drain = clamp01((exit - ((count - 1 - index) / count) * 0.3) / 0.7);
        const shown = progress * (1 - drain);
        if (shown <= 0) return null;

        // The band wipes downward: its height grows while the taper stays true,
        // so a half-revealed band is a real slice of the final shape.
        const revealBottom = top + bandHeight * shown;
        const revealWidth = topWidth + (bottomWidth - topWidth) * shown;
        const path = [
          `M ${centre - topWidth / 2} ${top}`,
          `L ${centre + topWidth / 2} ${top}`,
          `L ${centre + revealWidth / 2} ${revealBottom}`,
          `L ${centre - revealWidth / 2} ${revealBottom}`,
          "Z",
        ].join(" ");

        const conversion = Math.round((stage.value / (stages[0]?.value || 1)) * 100);
        const dropoff = next
          ? Math.round(((next.value - stage.value) / stage.value) * 100)
          : 0;
        const dropoffProgress = interpolate(
          frame,
          [
            start + staggerInFrames + durationInFrames * 0.6,
            start + staggerInFrames + durationInFrames * 0.6 + 12,
          ],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASING.enter },
        );

        return (
          <g key={stage.label}>
            <path
              d={path}
              fill={stage.color ?? color}
              opacity={
                (tailOpacity +
                  (1 - tailOpacity) * (1 - index / Math.max(1, count - 1))) *
                (1 - drain)
              }
            />

            <text
              x={gutter - labelSize}
              y={top + bandHeight * 0.36}
              fill={inkColor}
              fontSize={labelSize}
              fontWeight={600}
              textAnchor="end"
              dominantBaseline="central"
              // The name arrives with its band rather than ahead of it, so the
              // gutter reads as a caption on the shape and not a list.
              opacity={clamp01((shown - 0.25) / 0.35)}
            >
              {stage.label}
            </text>
            <text
              x={gutter - labelSize}
              y={top + bandHeight * 0.72}
              fill={labelColor}
              fontSize={labelSize * 0.92}
              fontWeight={600}
              textAnchor="end"
              dominantBaseline="central"
              opacity={clamp01((shown - 0.45) / 0.35)}
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {valueFormatter(stage.value)}
              {showConversion ? ` · ${conversion}%` : ""}
            </text>

            {showDropoff && next ? (
              <text
                x={width - labelSize * 0.5}
                y={bottom + gap / 2}
                fill={dropoffColor}
                fontSize={labelSize * 0.92}
                fontWeight={700}
                textAnchor="end"
                dominantBaseline="central"
                opacity={dropoffProgress * (1 - clamp01(exit / 0.6))}
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {dropoff >= 0 ? "+" : "−"}
                {Math.abs(dropoff)}%
              </text>
            ) : null}

            {showDropoff && index === 0 ? (
              <text
                x={width - labelSize * 0.5}
                y={top + bandHeight * 0.32}
                fill={labelColor}
                fontSize={labelSize * 0.82}
                fontWeight={600}
                textAnchor="end"
                dominantBaseline="central"
                opacity={clamp01((shown - 0.4) / 0.3)}
              >
                Drop-off
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
};
