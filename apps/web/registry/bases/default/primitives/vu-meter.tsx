import { bandEnergy, useAudioBands } from "@/remotion/lib/audio-viz-utils";

export type VuMeterProps = {
  /** Audio source. `.wav` — `useWindowedAudioData` accepts nothing else. */
  src: string;
  /** Stack the segments upward, or run them left to right. */
  orientation?: "vertical" | "horizontal";
  /** Number of segments in one channel. */
  segments?: number;
  /** Draw two channels. The second is weighted toward the top end. */
  channels?: 1 | 2;
  /** Segment size across the meter's short axis. */
  thickness?: number;
  /** Length of the meter along its own axis. */
  length?: number;
  /** Space between segments. */
  gap?: number;
  /** Segments below the warm zone. */
  color?: string;
  /** Segments in the top third. */
  warnColor?: string;
  /** Segments in the top eighth. */
  peakColor?: string;
  /** Unlit segment colour. */
  offColor?: string;
  /** Peak marker that falls back slowly. */
  showPeakHold?: boolean;
  /** Fall rate of the peak marker, in level per frame. */
  peakFallPerFrame?: number;
  /** Channel captions, e.g. `["L", "R"]`. */
  labels?: [string, string];
  labelColor?: string;
  /** Lifts or lowers the whole reading before it hits the segments. */
  sensitivity?: number;
  /**
   * Optional frame override.
   * Pass a parent `frame` when using inside `<Sequence from={...}>`.
   */
  frame?: number;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/**
 * A segmented level meter with peak hold.
 *
 * Level, not spectrum: `audiogram-bars` and `waveform-bars-radial` show *what*
 * the frequencies are doing, and this shows only how loud it is. That is the
 * reading an engineer actually watches, and the one that still works at 40px
 * wide in the corner of a frame.
 *
 * Peak hold is what makes a meter useful — a transient that lights the top
 * segment for a single frame is invisible at 30fps. The marker comes from the
 * decaying peaks the audio library already tracks, so it is reconstructed from
 * the waveform on every frame rather than held in component state: a render is
 * stateless and may start on any frame, and a ref-held marker would differ
 * between a preview scrub and a full render.
 */
export const VuMeter: React.FC<VuMeterProps> = ({
  src,
  orientation = "vertical",
  segments = 18,
  channels = 2,
  thickness = 26,
  length = 260,
  gap = 4,
  color = "#2dd4bf",
  warnColor = "#e8b86d",
  peakColor = "#f472b6",
  offColor = "rgba(250,250,250,0.09)",
  showPeakHold = true,
  peakFallPerFrame = 0.018,
  labels,
  labelColor = "rgba(250,250,250,0.55)",
  sensitivity = 1,
  frame: frameOverride,
}) => {
  const { bands, peaks } = useAudioBands({
    src,
    bandCount: 24,
    peakFallPerFrame,
    frame: frameOverride,
  });

  const third = Math.max(1, Math.round(bands.length / 3));
  const readings = [
    {
      level: clamp01(bandEnergy(bands) * sensitivity),
      peak: clamp01(bandEnergy(peaks) * sensitivity),
    },
    {
      // The right channel leans on the upper half of the spectrum, which is
      // what makes a stereo pair look alive rather than like one meter twice.
      level: clamp01(
        (bandEnergy(bands) * 0.72 + bandEnergy(bands, third, bands.length) * 0.4) *
          sensitivity,
      ),
      peak: clamp01(
        (bandEnergy(peaks) * 0.72 + bandEnergy(peaks, third, peaks.length) * 0.4) *
          sensitivity,
      ),
    },
  ].slice(0, channels);

  const segmentLength = (length - gap * (segments - 1)) / segments;
  const vertical = orientation === "vertical";

  const zoneColor = (index: number) => {
    const position = (index + 1) / segments;
    if (position > 0.875) return peakColor;
    if (position > 0.66) return warnColor;
    return color;
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: vertical ? "row" : "column",
        gap: thickness * 0.5,
        alignItems: vertical ? "flex-end" : "flex-start",
      }}
    >
      {readings.map((reading, channel) => {
        const lit = reading.level * segments;
        const peakSegment = reading.peak * segments;

        return (
          <div
            key={channel}
            style={{
              display: "flex",
              flexDirection: vertical ? "column" : "row",
              alignItems: "center",
              gap: thickness * 0.3,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: vertical ? "column-reverse" : "row",
                gap,
              }}
            >
              {Array.from({ length: segments }, (_, index) => {
                const on = index < lit;
                const isPeak =
                  showPeakHold &&
                  Math.floor(peakSegment) === index &&
                  peakSegment > 0.4;

                return (
                  <div
                    key={index}
                    style={{
                      width: vertical ? thickness : segmentLength,
                      height: vertical ? segmentLength : thickness,
                      borderRadius: Math.min(4, segmentLength * 0.35),
                      background: on || isPeak ? zoneColor(index) : offColor,
                      // A part-lit top segment reads as the level sitting
                      // between two steps instead of snapping to the lower one.
                      opacity: isPeak
                        ? 1
                        : on
                          ? Math.min(1, 0.45 + (lit - index) * 0.9)
                          : 1,
                    }}
                  />
                );
              })}
            </div>

            {labels ? (
              <span
                style={{
                  color: labelColor,
                  fontSize: thickness * 0.52,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                }}
              >
                {labels[channel]}
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};
