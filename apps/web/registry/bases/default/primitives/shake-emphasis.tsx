import type { CSSProperties, ReactNode } from "react";
import { useCurrentFrame } from "remotion";
import { MotionWrapper } from "@/remotion/lib/motion-wrapper";

export type ShakeAxis = "both" | "x" | "y";

export type ShakeEmphasisProps = {
  children: ReactNode;
  /** Frame the impact lands on. */
  startAtInFrames?: number;
  /** How long the shake takes to die out. Impacts are short — 12 to 24 frames. */
  durationInFrames?: number;
  /** Peak displacement, in px. */
  intensity?: number;
  /** Peak rotation, in degrees. Small values only; 3° already reads as violent. */
  rotation?: number;
  /** Scale punch on impact. 0 shakes without a hit. */
  punch?: number;
  /** How fast the element rattles, in shakes per second. */
  frequency?: number;
  /** Which way it moves. */
  axis?: ShakeAxis;
  /** How fast the shake dies. 1 decays evenly, 3 is a sharp hit. */
  decay?: number;
  /** Repeat the impact on this interval, in frames. Omit for a single hit. */
  repeatEveryInFrames?: number;
  /** Changes the rattle without changing any other prop. */
  seed?: number;
  block?: boolean;
  style?: CSSProperties;
  className?: string;
};

/** Deterministic -1..1. */
function noise(step: number, salt: number, seed: number): number {
  const value = Math.sin(step * 127.1 + salt * 311.7 + seed * 74.7) * 43758.5453;
  return (value - Math.floor(value)) * 2 - 1;
}

/**
 * Value noise rather than a sine.
 *
 * A shake driven by `sin(frame)` is a vibration — it reads as a motor, not an
 * impact, because every swing is the same size. Real impact shake is random in
 * amplitude and direction, so this samples a deterministic noise at
 * `frequency` samples per second and interpolates between samples with a
 * smoothstep. Interpolating is what keeps it from strobing at high `frequency`.
 */
function shakeAt(t: number, salt: number, seed: number): number {
  const index = Math.floor(t);
  const fraction = t - index;
  const smooth = fraction * fraction * (3 - 2 * fraction);
  const a = noise(index, salt, seed);
  const b = noise(index + 1, salt, seed);
  return a + (b - a) * smooth;
}

/**
 * A short impact shake.
 *
 * The envelope is the component: displacement peaks on the impact frame and
 * decays away, so the element is at rest before and after. Nothing here loops
 * by default — a shake that keeps going is a vibration, and the emphasis is
 * gone within half a second of the hit. Pass `repeatEveryInFrames` when the
 * shake is riding a beat.
 *
 * `punch` scales on the same envelope but with the opposite sign at the start,
 * which is the compression an impact actually produces; without it a shake
 * looks like the camera moved rather than the element being hit.
 */
export const ShakeEmphasis: React.FC<ShakeEmphasisProps> = ({
  children,
  startAtInFrames = 0,
  durationInFrames = 18,
  intensity = 16,
  rotation = 1.6,
  punch = 0.05,
  frequency = 22,
  axis = "both",
  decay = 2.2,
  repeatEveryInFrames,
  seed = 1,
  block,
  style,
  className,
}) => {
  const frame = useCurrentFrame();

  const since = frame - startAtInFrames;
  const period = repeatEveryInFrames && repeatEveryInFrames > 0 ? repeatEveryInFrames : null;
  const local = period ? ((since % period) + period) % period : since;
  const started = since >= 0;
  const span = Math.max(1, Math.round(durationInFrames));
  const t = started ? Math.min(1, Math.max(0, local / span)) : 1;

  const envelope = started ? (1 - t) ** decay : 0;
  // Sampling on absolute frames, not on `local`, so a repeated hit never
  // rattles through the identical pattern twice.
  const clock = (frame * frequency) / 30;
  const shakeX = axis === "y" ? 0 : shakeAt(clock, 1, seed) * intensity * envelope;
  const shakeY = axis === "x" ? 0 : shakeAt(clock, 2, seed) * intensity * envelope;
  const spin = shakeAt(clock, 3, seed) * rotation * envelope;
  // Compress on the hit, then overshoot past rest on the way back — the recoil.
  // `recoil` is zero at the impact and at rest, and peaks in between.
  const recoil = started ? Math.sin(Math.PI * t) * (1 - t) : 0;
  const squash = 1 - punch * envelope + punch * 0.6 * recoil;

  return (
    <MotionWrapper
      block={block}
      className={className}
      style={{
        ...style,
        transform: `translate(${shakeX.toFixed(2)}px, ${shakeY.toFixed(2)}px) rotate(${spin.toFixed(3)}deg) scale(${squash.toFixed(4)})`,
        willChange: "transform",
      }}
    >
      {children}
    </MotionWrapper>
  );
};
