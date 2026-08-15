import type { TransitionPresentation } from "@remotion/transitions";
import {
  displacementPresentation,
  type DisplacementPresentationProps,
} from "@/remotion/lib/displacement-presentation";
import type { MorphShapeName } from "@/remotion/lib/path-morph";
import {
  resolveTransitionTiming,
  type TransitionVariant,
} from "@/remotion/lib/transition-timing";

/**
 * Shape-mask morph.
 *
 * The mask channel of the shared displacement presentation with the turbulence
 * channel switched off. The arriving scene is revealed through a shape that
 * both grows and changes form, so the reveal has a silhouette rather than an
 * edge — a circle that only grows is `transition-circle-reveal`.
 *
 * `from` and `to` take the shared `MORPH_SHAPES` presets, which are authored on
 * one box with matched curve counts. Hand-authored pairs work too, but a pair
 * with mismatched segment counts interpolates into geometry that is valid SVG
 * and nonsense on screen.
 */

export type MorphShapeProps = {
  /** Shape the reveal starts as, at zero size. */
  from?: MorphShapeName | string;
  /** Shape it has become by the time it covers the frame. */
  to?: MorphShapeName | string;
  /** Where the shape grows from, 0→1 of the frame. */
  originX?: number;
  originY?: number;
  /**
   * Final size as a multiple of the frame diagonal. Defaults per shape — see
   * `SHAPE_OVERSHOOT`. Below the shape's own figure the corners furthest from
   * the origin are never revealed and the cut ends on a visible pop.
   */
  overshoot?: number;
  /**
   * Optional turbulence on the revealed scene. `0` — the default — keeps the
   * silhouette crisp; the warp is `transition-liquid-warp`'s job.
   */
  warp?: number;
};

/**
 * Size, as a multiple of the frame diagonal, at which each preset shape
 * actually covers a rectangular frame from its centre.
 *
 * The core's mask sizes every shape against the diagonal, which is exactly
 * right for a circle and wrong for anything with a point: a diamond of
 * diagonal width reaches only `1/√2` of that along 45°, so it lands with the
 * frame's four corners still showing the *previous* scene, then pops. These
 * are the geometric figures, rounded up a little:
 *
 * - `circle` / `square` cover at 1.0 — a shape that fills its own box.
 * - `diamond` needs `(w + h) / diagonal`, ~1.36 at 16:9, so 1.42 covers 9:16 too.
 * - `triangle` is the worst case; it has to grow well past the frame before its
 *   short side clears the bottom corners.
 * - `blob` is inset from its box on every side, so it needs a little slack.
 */
export const SHAPE_OVERSHOOT: Record<string, number> = {
  circle: 1.06,
  squircle: 1.1,
  square: 1.06,
  blob: 1.28,
  diamond: 1.42,
  triangle: 2.1,
};

/** Falls back to the circle figure for a raw path, whose extent is unknown. */
function resolveOvershoot(to: MorphShapeName | string): number {
  return SHAPE_OVERSHOOT[to] ?? SHAPE_OVERSHOOT.circle;
}

export const MORPH_SHAPE_DEFAULTS = {
  // Circle to diamond rather than circle to squircle: a squircle is a circle
  // with the corners barely pushed out, so the default read as a plain circular
  // reveal and the component looked like a duplicate of `transition-circle-reveal`.
  from: "circle",
  to: "diamond",
  originX: 0.5,
  originY: 0.5,
  warp: 0,
} as const satisfies Omit<Required<MorphShapeProps>, "overshoot">;

function morphProps(props: MorphShapeProps): DisplacementPresentationProps {
  const to = props.to ?? MORPH_SHAPE_DEFAULTS.to;
  // Field by field, never spread: an explicit `undefined` would overwrite a
  // core default and `undefined * n` is NaN, which SVG drops silently.
  return {
    scale: props.warp ?? MORPH_SHAPE_DEFAULTS.warp,
    mask: {
      from: props.from ?? MORPH_SHAPE_DEFAULTS.from,
      to,
      originX: props.originX ?? MORPH_SHAPE_DEFAULTS.originX,
      originY: props.originY ?? MORPH_SHAPE_DEFAULTS.originY,
      overshoot: props.overshoot ?? resolveOvershoot(to),
    },
    // The shape covers the frame as it lands, so there is nothing to crossfade
    // and a fade would only make the outgoing scene visible through the shape.
    fade: false,
    lead: 1,
    affect: "entering",
  };
}

/** Shape-mask morph presentation for TransitionSeries */
export function morphShape(
  props: MorphShapeProps = {},
): TransitionPresentation<DisplacementPresentationProps> {
  return displacementPresentation(morphProps(props));
}

export type TransitionMorphShapeConfig = MorphShapeProps & {
  durationInFrames?: number;
  variant?: TransitionVariant;
};

/** Shape morph transition config for use with TransitionSeries.Transition */
export function transitionMorphShape({
  durationInFrames = 24,
  variant = "editorial",
  ...presentationProps
}: TransitionMorphShapeConfig = {}) {
  return {
    presentation: morphShape(presentationProps),
    timing: resolveTransitionTiming({ durationInFrames, variant }),
  };
}

export function getTransitionMorphShapeDuration(
  config: TransitionMorphShapeConfig = {},
  fps: number,
): number {
  return transitionMorphShape(config).timing.getDurationInFrames({ fps });
}
