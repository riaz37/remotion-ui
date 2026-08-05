import { useAudioBands } from "@/remotion/lib/audio-viz-utils";

export type AudiogramBarsProps = {
  src: string;
  height?: number;
  barColor?: string;
  /** Second colour for the gradient across the spectrum. Defaults to `barColor`. */
  barColorEnd?: string;
  barGap?: number;
  numberOfSamples?: number;
  maxBarCount?: number;
  /** `bottom` grows bars from the baseline, `center` mirrors them around it. */
  align?: "bottom" | "center";
  /** Draws the decaying peak cap above each bar. */
  showPeaks?: boolean;
  /** Mirrored, faded copy below the baseline. Ignored when `align` is `center`. */
  showReflection?: boolean;
  /**
   * Optional frame override.
   * Pass a parent `frame` when using inside `<Sequence from={...}>` to avoid discontinuities.
   */
  frame?: number;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Blends two hex colours so a gradient can be sampled per bar. */
function mixHex(from: string, to: string, t: number) {
  const parse = (hex: string) => {
    const value = hex.replace("#", "");
    const full =
      value.length === 3
        ? value
            .split("")
            .map((char) => char + char)
            .join("")
        : value.slice(0, 6);
    return [
      Number.parseInt(full.slice(0, 2), 16),
      Number.parseInt(full.slice(2, 4), 16),
      Number.parseInt(full.slice(4, 6), 16),
    ];
  };

  const [r1, g1, b1] = parse(from);
  const [r2, g2, b2] = parse(to);

  if ([r1, g1, b1, r2, g2, b2].some((channel) => Number.isNaN(channel))) {
    return from;
  }

  const channel = (a: number, b: number) =>
    Math.round(lerp(a, b, clamp01(t)))
      .toString(16)
      .padStart(2, "0");

  return `#${channel(r1, r2)}${channel(g1, g2)}${channel(b1, b2)}`;
}

type BarProps = {
  value: number;
  peak: number;
  color: string;
  align: "bottom" | "center";
  showPeaks: boolean;
  showReflection: boolean;
};

function Bar({
  value,
  peak,
  color,
  align,
  showPeaks,
  showReflection,
}: BarProps) {
  // A visible floor keeps the baseline legible during silence instead of
  // leaving a gap where the spectrum used to be.
  const level = Math.max(0.035, clamp01(value));
  const cap = Math.max(level, clamp01(peak));
  const glow = lerp(0, 18, level);
  const isCentered = align === "center";

  return (
    <div
      style={{
        flex: 1,
        position: "relative",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: isCentered ? "center" : "flex-end",
      }}
    >
      <div
        style={{
          height: `${level * (isCentered ? 100 : 100)}%`,
          borderRadius: 999,
          background: isCentered
            ? `linear-gradient(to bottom, ${color}33 0%, ${color} 50%, ${color}33 100%)`
            : `linear-gradient(to top, ${color}b3 0%, ${color} 62%, ${color}f2 100%)`,
          boxShadow: level > 0.12 ? `0 0 ${Math.round(glow)}px ${color}4d` : undefined,
        }}
      />
      {showReflection && !isCentered ? (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            height: `${level * 34}%`,
            borderRadius: 999,
            background: `linear-gradient(to bottom, ${color}3d 0%, transparent 100%)`,
          }}
        />
      ) : null}
      {showPeaks ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            height: 2,
            borderRadius: 999,
            background: color,
            opacity: 0.55,
            ...(isCentered
              ? { top: `${50 - cap * 50}%` }
              : { bottom: `${cap * 100}%` }),
          }}
        />
      ) : null}
    </div>
  );
}

/**
 * Spectrum bars driven by the audio at the current frame.
 *
 * Bands are grouped logarithmically and tilted (see `toSpectrumBands`) so the
 * whole width reacts rather than only the bass end, and levels run through an
 * attack/release follower so transients punch without the display flickering.
 */
export const AudiogramBars: React.FC<AudiogramBarsProps> = ({
  src,
  height = 120,
  barColor = "#e8b86d",
  barColorEnd,
  barGap = 3,
  numberOfSamples = 128,
  maxBarCount = 48,
  align = "bottom",
  showPeaks = true,
  showReflection = false,
  frame: frameOverride,
}) => {
  const { bands, peaks } = useAudioBands({
    src,
    numberOfSamples,
    bandCount: maxBarCount,
    frame: frameOverride,
  });

  const endColor = barColorEnd ?? barColor;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "stretch",
        height,
        gap: barGap,
        width: "100%",
      }}
    >
      {bands.map((value, index) => (
        <Bar
          // Bands are a fixed-length spectrum, so the index is the identity.
          key={index}
          value={value}
          peak={peaks[index] ?? value}
          color={mixHex(barColor, endColor, index / Math.max(1, bands.length - 1))}
          align={align}
          showPeaks={showPeaks}
          showReflection={showReflection}
        />
      ))}
    </div>
  );
};
