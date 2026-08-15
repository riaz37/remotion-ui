import type { CSSProperties, ReactNode } from "react";
import {
  useAudioAmplitude,
  type AudioBandSelector,
} from "@/remotion/lib/audio-viz-utils";

/**
 * Scales whatever it wraps by the audio's per-frame amplitude.
 *
 * It draws nothing of its own on purpose — a logo, a chart, a whole scene can
 * all be made to breathe with the track by wrapping them, and the wrapper stays
 * composable with the enter/exit primitives above and below it.
 *
 * The amplitude comes from the shared `useAudioAmplitude()` path, so this and
 * `audio-pulse` (and every audio component after them) move in step instead of
 * each running their own FFT with slightly different constants.
 */

export type AudioReactiveScaleProps = {
  /** Audio source. `useWindowedAudioData()` requires an uncompressed `.wav`. */
  src: string;
  children: ReactNode;
  /** Scale at silence. */
  minScale?: number;
  /** Scale at a full-amplitude hit. */
  maxScale?: number;
  /** Which slice of the spectrum drives the motion. */
  band?: AudioBandSelector;
  sensitivity?: number;
  /** Exponent on the level. Below 1 lifts quiet passages. */
  compression?: number;
  /** Restrict the scale to one axis — a bar chart should only grow upward. */
  axis?: "both" | "x" | "y";
  /** Opacity at silence. Left at 1 the wrapper never touches opacity. */
  minOpacity?: number;
  /**
   * Rotation in degrees at a full hit. Small values (1-3) stop a square element
   * from reading as a pure zoom.
   */
  tilt?: number;
  transformOrigin?: CSSProperties["transformOrigin"];
  /** Fill the parent instead of shrink-wrapping the child. */
  block?: boolean;
  /** Frame override — pass the parent frame inside a `<Sequence from={...}>`. */
  frame?: number;
  style?: CSSProperties;
  className?: string;
};

export const AudioReactiveScale: React.FC<AudioReactiveScaleProps> = ({
  src,
  children,
  minScale = 1,
  maxScale = 1.16,
  band = "bass",
  sensitivity = 1,
  compression = 0.78,
  axis = "both",
  minOpacity = 1,
  tilt = 0,
  transformOrigin = "center center",
  block = false,
  frame: frameOverride,
  style,
  className,
}) => {
  // Every option is defaulted above rather than spread in: an explicitly
  // undefined field reaching the amplitude chain resolves the whole scale to
  // NaN, which renders as a silently missing element rather than an error.
  const { level } = useAudioAmplitude({
    src,
    band,
    sensitivity,
    compression,
    frame: frameOverride,
  });

  const scale = minScale + (maxScale - minScale) * level;
  const scaleValue =
    axis === "both"
      ? `${scale}`
      : axis === "x"
        ? `${scale} 1`
        : `1 ${scale}`;

  return (
    <div
      className={className}
      style={{
        display: block ? "block" : "inline-block",
        ...(block ? { width: "100%", height: "100%" } : {}),
        scale: scaleValue,
        rotate: tilt === 0 ? undefined : `${(tilt * level).toFixed(3)}deg`,
        opacity: minOpacity + (1 - minOpacity) * level,
        transformOrigin,
        willChange: "transform",
        ...style,
      }}
    >
      {children}
    </div>
  );
};
