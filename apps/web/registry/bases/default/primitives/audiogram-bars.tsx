import { useCurrentFrame } from "remotion";
import {
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
};

function PlaceholderBars({
  height,
  barColor,
  barGap,
  maxBarCount,
}: {
  height: number;
  barColor: string;
  barGap: number;
  maxBarCount: number;
}) {
  const frame = useCurrentFrame();

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
      {Array.from({ length: maxBarCount }).map((_, index) => {
        const wave =
          0.35 +
          0.3 * Math.sin((frame + index * 4) / 8) +
          0.2 * Math.sin((frame + index * 2) / 3);
        return (
          <div
            key={index}
            style={{
              flex: 1,
              height: `${Math.max(12, wave * 100)}%`,
              background: `linear-gradient(to top, ${barColor} 0%, ${barColor}99 100%)`,
              borderRadius: 3,
              boxShadow: wave > 0.55 ? `0 0 10px ${barColor}44` : undefined,
            }}
          />
        );
      })}
    </div>
  );
}

export const AudiogramBars: React.FC<AudiogramBarsProps> = ({
  src,
  height = 120,
  barColor = "#3b82f6",
  barGap = 2,
  numberOfSamples = 64,
  maxBarCount = 48,
}) => {
  const { frequencies } = useSpectrumBars({ src, numberOfSamples });

  if (!frequencies) {
    return (
      <PlaceholderBars
        height={height}
        barColor={barColor}
        barGap={barGap}
        maxBarCount={maxBarCount}
      />
    );
  }

  const scaled = scaleFrequenciesForDisplay(frequencies);
  const step = Math.max(1, Math.floor(scaled.length / maxBarCount));
  const bars = scaled.filter((_, index) => index % step === 0).slice(0, maxBarCount);

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
      {bars.map((value, index) => (
        <div
          key={index}
          style={{
            flex: 1,
            height: `${Math.max(6, value * 100)}%`,
            background: `linear-gradient(to top, ${barColor} 0%, ${barColor}cc 100%)`,
            borderRadius: 3,
            boxShadow: value > 0.35 ? `0 0 12px ${barColor}55` : undefined,
          }}
        />
      ))}
    </div>
  );
};
