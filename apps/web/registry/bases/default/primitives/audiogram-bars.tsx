import { useCurrentFrame, useVideoConfig } from "remotion";
import {
  DEFAULT_AUDIO_WINDOW_SECONDS,
  downsampleSpectrum,
  scaleFrequenciesForDisplay,
  useSpectrumBars,
} from "@/remotion/lib/audio-viz-utils";

export type AudiogramBarsProps = {
  src: string;
  height?: number;
  barColor?: string;
  barGap?: number;
  numberOfSamples?: number;
  maxBarCount?: number;
  /**
   * Optional frame override.
   * Pass a parent `frame` when using inside `<Sequence from={...}>` to avoid discontinuities.
   */
  frame?: number;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

type BarRendererProps = {
  bars: number[];
  height: number;
  barColor: string;
  barGap: number;
};

function BarRenderer({ bars, height, barColor, barGap }: BarRendererProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        height,
        gap: barGap,
        width: "100%",
      }}
    >
      {bars.map((value, index) => {
        const v = clamp01(value);
        const minPct = 0.06;
        const pct = Math.max(minPct, v);
        const glow = lerp(8, 22, v);
        const sheen = lerp(0.06, 0.22, v);
        const radius = Math.max(2, Math.round(lerp(4, 2, index / Math.max(1, bars.length - 1))));

        return (
          <div
            key={index}
            style={{
              flex: 1,
              height: `${pct * 100}%`,
              background: [
                `linear-gradient(to top, ${barColor} 0%, ${barColor}9a 55%, ${barColor}22 100%)`,
                `linear-gradient(to bottom, rgba(255,255,255,${sheen}) 0%, rgba(255,255,255,0) 55%)`,
              ].join(", "),
              borderRadius: radius,
              boxShadow:
                v > 0.2
                  ? `0 0 ${Math.round(glow)}px ${barColor}55, 0 0 ${Math.round(glow * 0.55)}px ${barColor}22`
                  : undefined,
              filter: "saturate(1.05)",
            }}
          />
        );
      })}
    </div>
  );
}

function LoadingBars({
  height,
  barColor,
  barGap,
  maxBarCount,
  frame,
  fps,
}: {
  height: number;
  barColor: string;
  barGap: number;
  maxBarCount: number;
  frame: number;
  fps: number;
}) {
  const bars = Array.from({ length: maxBarCount }, (_, index) => {
    const t = frame / fps;
    return (
      0.12 +
      0.1 * Math.sin(t * Math.PI * 2 * 1.4 + index * 0.35) +
      0.06 * Math.sin(t * Math.PI * 2 * 2.8 + index * 0.18)
    );
  });

  return (
    <BarRenderer bars={bars} height={height} barColor={barColor} barGap={barGap} />
  );
}

export const AudiogramBars: React.FC<AudiogramBarsProps> = ({
  src,
  height = 120,
  barColor = "#e8b86d",
  barGap = 2,
  numberOfSamples = 64,
  maxBarCount = 48,
  frame: frameOverride,
}) => {
  const localFrame = useCurrentFrame();
  const frame = frameOverride ?? localFrame;
  const { fps } = useVideoConfig();

  const { frequencies } = useSpectrumBars({
    src,
    numberOfSamples,
    windowInSeconds: DEFAULT_AUDIO_WINDOW_SECONDS,
    frame,
  });

  if (!frequencies) {
    return (
      <LoadingBars
        height={height}
        barColor={barColor}
        barGap={barGap}
        maxBarCount={maxBarCount}
        frame={frame}
        fps={fps}
      />
    );
  }

  const bars = downsampleSpectrum(
    scaleFrequenciesForDisplay(frequencies),
    maxBarCount,
  );

  return (
    <BarRenderer bars={bars} height={height} barColor={barColor} barGap={barGap} />
  );
};
