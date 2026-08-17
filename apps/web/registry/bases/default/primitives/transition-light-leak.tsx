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
   * Where the leak peaks inside its window, 0→1. `TransitionSeries.Overlay`
   * centres the overlay on the cut, so the midpoint of the window *is* the
   * seam — the default sits the flare there. Anything lower peaks before the
   * cut and is already decaying when the splice happens.
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
  peakAt = 0.5,
  blendMode = "screen",
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames: sequenceDuration } = useVideoConfig();
  // An overlay is mounted for exactly its own window, so its length is
  // knowable. Defaulting to a fixed `DURATION.fast` made the envelope finish
  // early — or never finish — whenever the overlay was not 12 frames long.
  const span = durationInFrames ?? sequenceDuration ?? DURATION.fast;
  const peak = Math.min(Math.max(peakAt, 0.05), 0.95);

  // Blooms fast, is brightest exactly at `peakAt`, then decays through the end
  // of the window. The old shape hit full intensity at 55% of the way to
  // `peakAt` and was already falling by the time it got there, so the flare
  // never actually peaked where the prop said it did.
  const envelope = interpolate(
    frame,
    [0, span * peak * 0.5, span * peak, span],
    [0, intensity * 0.72, intensity, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASING.editorial,
    },
  );
  const scale = interpolate(envelope, [0, intensity], [1.08, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    output: "perceptual-scale",
  });

  return (
    <AbsoluteFill style={{ opacity: envelope, scale, mixBlendMode: blendMode }}>
      <LightLeak durationInFrames={span} seed={seed} hueShift={hueShift} />
    </AbsoluteFill>
  );
};
