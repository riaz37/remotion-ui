import { LightLeak } from "@remotion/light-leaks";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { DURATION, EASING } from "@/remotion/lib/motion-tokens";

export type TransitionLightLeakProps = {
  durationInFrames?: number;
  seed?: number;
  /** Hue rotation in degrees — warm amber by default */
  hueShift?: number;
  /** Peak opacity of the leak, 0→1. */
  intensity?: number;
  /**
   * Where the leak peaks inside its window, 0→1. Sit it on the cut itself so
   * the flare hides the seam rather than arriving after it.
   */
  peakAt?: number;
  blendMode?: "screen" | "plus-lighter" | "normal";
};

/** Light leak overlay for TransitionSeries.Overlay */
export const TransitionLightLeak: React.FC<TransitionLightLeakProps> = ({
  durationInFrames,
  seed = 0,
  hueShift = 28,
  intensity = 1,
  peakAt = 0.4,
  blendMode = "screen",
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames: sequenceDuration } = useVideoConfig();
  // An overlay is mounted for exactly its own window, so its length is
  // knowable. Defaulting to a fixed `DURATION.fast` made the envelope finish
  // early — or never finish — whenever the overlay was not 12 frames long.
  const span = durationInFrames ?? sequenceDuration ?? DURATION.fast;
  const peak = Math.min(Math.max(peakAt, 0.05), 0.95);

  const envelope = interpolate(
    frame,
    [0, span * peak * 0.55, span * peak, span],
    [0, intensity, intensity * 0.85, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASING.editorial,
    },
  );
  const scale = interpolate(envelope, [0, intensity], [1.08, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity: envelope, scale, mixBlendMode: blendMode }}>
      <LightLeak durationInFrames={span} seed={seed} hueShift={hueShift} />
    </AbsoluteFill>
  );
};
