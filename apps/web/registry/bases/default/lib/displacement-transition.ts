import { prepareMorph, MORPH_SHAPES, type MorphPair, type MorphShapeName } from "./path-morph";

/**
 * Frame-independent maths behind the displacement transitions.
 *
 * Kept separate from the presentation component so the numbers can be reasoned
 * about — and unit-tested — without a renderer. The React half lives in
 * `displacement-presentation.tsx`; this file is what both it and any bespoke
 * displacement effect share.
 *
 * **The displace contract.** Every presentation in this registry scales its
 * effect by `transitionPhase().displace`, where `0` means "untouched". That is
 * not a style choice: `TransitionSeries` keeps a presentation mounted for the
 * whole life of its sequence and holds `presentationProgress` at 0 outside the
 * overlap, so any effect that is non-zero at `displace === 0` is applied to the
 * scene for every frame it is on screen. A warp that forgets this looks like a
 * broken scene, not a broken transition. `displacementIntensity()` below is
 * pinned to 0 at both ends for exactly that reason.
 */

export type DisplacementProfile = "peak" | "ramp-in" | "ramp-out";

export type DisplacementCoreConfig = {
  /** Peak displacement in pixels. Ignored when `scaleRatio` is set. */
  scale?: number;
  /**
   * Peak displacement as a fraction of the frame's **short** axis.
   *
   * Preferred over `scale`. An absolute pixel displacement is 26% of a 540px
   * stage and 7% of a 1080px one, so the same config reads as a different
   * effect at every composition size. A ratio is resolved against the frame
   * inside `displacementFrame`, so the warp looks identical at any size.
   */
  scaleRatio?: number;
  /**
   * Turbulence base frequency. Low values (0.004-0.01) give large, liquid
   * lobes; high values (0.05+) give sand, which reads as noise rather than as
   * a warp at 30 fps.
   */
  frequency?: number;
  /** Turbulence octaves. Above 3 costs a lot and adds little at this scale. */
  octaves?: number;
  seed?: number;
  turbulenceType?: "fractalNoise" | "turbulence";
  /**
   * How much the noise field re-seeds across the cut. 0 holds one static field
   * and reads as a lens; higher values boil, which reads as liquid.
   */
  churn?: number;
  /** Peak blur in pixels, applied on the same curve as the displacement. */
  blur?: number;
  /** Shape of the intensity across the cut. */
  profile?: DisplacementProfile;
};

export const DISPLACEMENT_DEFAULTS = {
  scale: 90,
  frequency: 0.008,
  octaves: 2,
  seed: 7,
  turbulenceType: "fractalNoise",
  churn: 6,
  blur: 0,
  profile: "peak",
  // `scaleRatio` has no default: it is the opt-in frame-relative form, and a
  // default here would silently override every caller's absolute `scale`.
} as const satisfies Omit<Required<DisplacementCoreConfig>, "scaleRatio">;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/**
 * 0-1 intensity for a given displacement.
 *
 * `peak` is the default because a warp that is strongest in the middle of the
 * cut reads as a stress artefact of the move; one that is strongest at an end
 * reads as a scene that was already broken before the cut started.
 */
export function displacementIntensity(
  displace: number,
  profile: DisplacementProfile = DISPLACEMENT_DEFAULTS.profile,
): number {
  const d = clamp01(displace);
  if (profile === "ramp-in") {
    return d;
  }
  if (profile === "ramp-out") {
    return 1 - d;
  }
  /* Parabolic hump: 0 at both ends, 1 at the middle, no corner at the peak.
   * A sine hump has the same shape but `Math.sin(Math.PI)` is 1.2e-16 rather
   * than 0, so a scene at rest would carry a residual displacement forever —
   * tiny, but the contract is "exactly untouched", and a downstream config with
   * a large `scale` turns a tiny residual into a visible one. */
  return 4 * d * (1 - d);
}

export type DisplacementFrameState = {
  /** Displacement in pixels this frame. */
  scale: number;
  /** Blur in pixels this frame. */
  blur: number;
  /** Integer turbulence seed. feTurbulence ignores the fraction. */
  seed: number;
  /** 0-1 intensity, for callers that want to drive something else with it. */
  intensity: number;
  /**
   * How far the content must be scaled up to hide the transparent edge the
   * displacement drags in from outside the layer.
   */
  overscan: number;
};

/**
 * Resolves the per-frame filter numbers.
 *
 * `frameSize` must be the **smaller** of the frame's width and height. The
 * overscan is a uniform scale, so sizing it against the width under-covers the
 * short axis of a 16:9 frame — which renders as a transparent bite out of one
 * corner in the middle of the cut, and nowhere else.
 */
export function displacementFrame(
  displace: number,
  frameSize: number,
  config: DisplacementCoreConfig = {},
): DisplacementFrameState {
  // Defaulted field by field. Spreading the config would let an explicitly
  // undefined property overwrite a default with undefined, and `undefined * n`
  // is NaN — which SVG silently drops, so the filter would just stop working.
  const peakScale =
    config.scaleRatio !== undefined
      ? config.scaleRatio * frameSize
      : (config.scale ?? DISPLACEMENT_DEFAULTS.scale);
  const peakBlur = config.blur ?? DISPLACEMENT_DEFAULTS.blur;
  const seedBase = config.seed ?? DISPLACEMENT_DEFAULTS.seed;
  const churn = config.churn ?? DISPLACEMENT_DEFAULTS.churn;
  const profile = config.profile ?? DISPLACEMENT_DEFAULTS.profile;

  const intensity = displacementIntensity(displace, profile);
  const scale = peakScale * intensity;
  const blur = peakBlur * intensity;

  return {
    scale,
    blur,
    // Driven by `displace`, not by the frame number: the same point in the cut
    // must produce the same field whether it is reached by playback, by a seek
    // in the Player, or by a distributed render of a single frame.
    seed: Math.round(seedBase + clamp01(displace) * churn),
    intensity,
    overscan: overscanFor(scale, blur, frameSize),
  };
}

/**
 * How far the filtered layer must be scaled up to keep its own transparent
 * border off screen.
 *
 * `feDisplacementMap` samples up to `scale / 2` away in each direction and the
 * blur spreads about `3σ`, so the outer `drag` pixels of every edge are
 * contaminated with transparency dragged in from outside the layer. The clean
 * middle is therefore `frameSize - 2·drag` tall, and the scale-up has to make
 * *that* band cover the whole stage — not merely add `drag` pixels of height.
 *
 * The old form (`1 + (scale + 4) / frameSize`) missed the factor: at the
 * default 140px peak on a 540px stage it returned 1.27 where 1.41 is needed,
 * which is exactly the mid-cut bite of page background the audit found. The
 * closed form is `frameSize / (frameSize - 2·drag)`.
 */
export function overscanFor(
  scale: number,
  blur: number,
  frameSize: number,
): number {
  const drag = scale / 2 + blur * 3;
  if (drag <= 0 || frameSize <= 0) return 1;
  // Two extra pixels per edge absorb rounding at the composite boundary.
  const clean = frameSize - 2 * (drag + 2);
  // Past a 3x zoom the cut is a zoom rather than a warp, and a displacement
  // wide enough to need more than that cannot be hidden by scaling at all —
  // the config wants a smaller `scaleRatio`, not a bigger overscan.
  if (clean <= 0) return MAX_OVERSCAN;
  return Math.min(MAX_OVERSCAN, frameSize / clean);
}

/** Ceiling on the overscan zoom. See `overscanFor`. */
const MAX_OVERSCAN = 3;

/** Below this the three extra composites cost more than the effect is worth. */
export const DISPLACEMENT_EPSILON = 0.5;

export type DisplacementMaskConfig = {
  /** Named preset or a raw `d` string. */
  from?: MorphShapeName | string;
  to?: MorphShapeName | string;
  /**
   * Size the mask reaches at full coverage, as a multiple of the frame
   * diagonal. Above 1 guarantees the shape clears the corners; a circle that
   * stops at 1.0 leaves four un-revealed corners.
   */
  overshoot?: number;
  /** Where the shape grows from, 0-1 of the frame. */
  originX?: number;
  originY?: number;
};

export const MASK_DEFAULTS = {
  from: "circle",
  to: "circle",
  overshoot: 1.06,
  originX: 0.5,
  originY: 0.5,
} as const satisfies Required<DisplacementMaskConfig>;

function resolveShape(shape: MorphShapeName | string): string {
  return shape in MORPH_SHAPES
    ? MORPH_SHAPES[shape as MorphShapeName]
    : shape;
}

/**
 * Prepares the mask morph pair in a unit (0-1) box.
 *
 * Keeping the geometry unit-sized means the per-frame work is one
 * `interpolatePath` call and an SVG `transform`; scaling the path itself every
 * frame would re-measure a bounding box 30 times a second for a shape whose
 * proportions never change.
 */
export function prepareMaskMorph(config: DisplacementMaskConfig = {}): MorphPair {
  const from = resolveShape(config.from ?? MASK_DEFAULTS.from);
  const to = resolveShape(config.to ?? MASK_DEFAULTS.to);
  return prepareMorph(from, to, {
    align: true,
    fit: { x: 0, y: 0, width: 1, height: 1 },
  });
}

export type MaskFrameState = {
  /** 0-1 of the frame that is revealed. */
  coverage: number;
  /** Size of the unit shape in pixels. */
  size: number;
  centerX: number;
  centerY: number;
  /** True once the mask covers the frame and can be dropped entirely. */
  isComplete: boolean;
};

export function maskFrame(
  displace: number,
  frame: { width: number; height: number },
  config: DisplacementMaskConfig = {},
): MaskFrameState {
  const overshoot = config.overshoot ?? MASK_DEFAULTS.overshoot;
  const originX = config.originX ?? MASK_DEFAULTS.originX;
  const originY = config.originY ?? MASK_DEFAULTS.originY;

  const coverage = 1 - clamp01(displace);
  const diagonal = Math.hypot(frame.width, frame.height);

  return {
    coverage,
    size: diagonal * overshoot * coverage,
    centerX: frame.width * originX,
    centerY: frame.height * originY,
    isComplete: coverage >= 1,
  };
}
