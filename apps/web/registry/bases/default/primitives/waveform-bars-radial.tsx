import type { ReactNode } from "react";
import { useAudioBands } from "@/remotion/lib/audio-viz-utils";

export type WaveformBarsRadialProps = {
  /** Audio source. `.wav` — `useWindowedAudioData` accepts nothing else. */
  src: string;
  /** Content in the middle of the ring: artwork, a logo, a title. */
  children?: ReactNode;
  /** Diameter of the inner circle the bars stand on. */
  radius?: number;
  /** How many bars go around the ring. */
  barCount?: number;
  /** Bar thickness in px. */
  barWidth?: number;
  /** Bar length at silence. */
  minLength?: number;
  /** Bar length at full level. */
  maxLength?: number;
  color?: string;
  /** Second colour, blended toward the loudest bars. Omit for one colour. */
  peakColor?: string;
  /** Mirror the spectrum so the ring is symmetric about its vertical axis. */
  mirror?: boolean;
  /** Degrees the whole ring rotates per second. `0` holds it still. */
  spinPerSecond?: number;
  /** Bars grow inward as well as outward. */
  bidirectional?: boolean;
  /** Faint ring under the bars. */
  showTrack?: boolean;
  trackColor?: string;
  /**
   * Optional frame override.
   * Pass a parent `frame` when using inside `<Sequence from={...}>`.
   */
  frame?: number;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/**
 * A spectrum wrapped into a circle, around whatever sits in the middle.
 *
 * Distinct geometry from `audiogram-bars`, which is a straight row — a ring
 * frames a centre element instead of underlining it, and it reads at any aspect
 * ratio, which is why it is the shape social audio clips use.
 *
 * `mirror` reflects the spectrum across the vertical axis by default. A ring
 * that runs low-to-high all the way round is lopsided: all the energy sits on
 * one side, and the shape wobbles rather than pulses.
 */
export const WaveformBarsRadial: React.FC<WaveformBarsRadialProps> = ({
  src,
  children,
  radius = 150,
  barCount = 72,
  barWidth = 5,
  minLength = 10,
  maxLength = 90,
  color = "#e8b86d",
  peakColor,
  mirror = true,
  spinPerSecond = 6,
  bidirectional = false,
  showTrack = true,
  trackColor = "rgba(250,250,250,0.1)",
  frame: frameOverride,
}) => {
  // Mirroring halves how many distinct bands the ring needs, so the spectrum
  // is not stretched thin across twice as many bars as it has resolution for.
  const bandCount = mirror ? Math.ceil(barCount / 2) : barCount;
  const { bands, frame, fps } = useAudioBands({
    src,
    bandCount,
    frame: frameOverride,
  });

  const box = (radius + maxLength) * 2;
  const centre = box / 2;
  const spin = (frame / fps) * spinPerSecond;

  return (
    <div style={{ position: "relative", width: box, height: box }}>
      <svg
        width={box}
        height={box}
        viewBox={`0 0 ${box} ${box}`}
        style={{ position: "absolute", inset: 0 }}
      >
        {showTrack ? (
          <circle
            cx={centre}
            cy={centre}
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth={1.5}
          />
        ) : null}

        <g transform={`rotate(${spin} ${centre} ${centre})`}>
          {Array.from({ length: barCount }, (_, index) => {
            const half = Math.floor(barCount / 2);
            // Bars past the halfway point read the same band as their mirror
            // partner, counting back from the top.
            const bandIndex = mirror
              ? index < half
                ? index
                : barCount - 1 - index
              : index;
            const level = clamp01(bands[bandIndex % bands.length] ?? 0);
            const length = minLength + (maxLength - minLength) * level;
            const angle = (index / barCount) * 360 - 90;
            const inner = bidirectional ? radius - length * 0.35 : radius;

            return (
              <g key={index} transform={`rotate(${angle} ${centre} ${centre})`}>
                <line
                  x1={centre + inner}
                  y1={centre}
                  x2={centre + radius + length}
                  y2={centre}
                  stroke={
                    peakColor && level > 0.75 ? peakColor : color
                  }
                  strokeWidth={barWidth}
                  strokeLinecap="round"
                  opacity={0.55 + level * 0.45}
                />
              </g>
            );
          })}
        </g>
      </svg>

      {children ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
          }}
        >
          <div
            style={{
              width: radius * 1.62,
              height: radius * 1.62,
              display: "grid",
              placeItems: "center",
              overflow: "hidden",
              borderRadius: "50%",
            }}
          >
            {children}
          </div>
        </div>
      ) : null}
    </div>
  );
};
