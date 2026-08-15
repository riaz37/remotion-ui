import {
  getBoundingBox,
  interpolatePath,
  normalizePath,
  reversePath,
  scalePath,
  translatePath,
} from "@remotion/paths";

/**
 * Shared machinery for morphing one SVG path into another.
 *
 * `interpolatePath()` from `@remotion/paths` does the hard part, but calling it
 * raw is wrong in three ways that only show up in a render:
 *
 * 1. **Cost.** It re-parses and re-reduces both `d` strings on every frame. At
 *    30 fps against a detailed logo that is thousands of parses per second for
 *    a pair of strings that never change, so results are cached by the pair.
 * 2. **Twisting.** Nothing guarantees the two paths run the same way round. A
 *    square drawn clockwise morphing into a circle drawn anticlockwise folds
 *    through itself halfway. `alignForMorph()` picks the winding that keeps the
 *    shape convex through the middle of the move.
 * 3. **Scale mismatch.** Two shapes authored in different viewBoxes morph
 *    through a jump in size. `fitToBox()` normalises them onto one box first.
 *
 * `shape-morph`, `blob-morph`, `connector-lines` and the displacement
 * transitions all consume this rather than each solving those three again.
 */

export type MorphPair = { from: string; to: string };

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/**
 * Interpolators are keyed by the pair of `d` strings, which are static for the
 * life of a composition. A bounded map keeps a pathological caller — one
 * generating a fresh path per frame — from growing the cache without limit.
 */
const MAX_CACHE_ENTRIES = 256;
const alignmentCache = new Map<string, string>();

function cacheGet<T>(cache: Map<string, T>, key: string, build: () => T): T {
  const hit = cache.get(key);
  if (hit !== undefined) {
    return hit;
  }
  const value = build();
  if (cache.size >= MAX_CACHE_ENTRIES) {
    cache.clear();
  }
  cache.set(key, value);
  return value;
}

/**
 * Signed area of a path's sampled outline. Negative and positive are opposite
 * windings; the magnitude is not meaningful here, only the sign.
 */
function signedArea(d: string): number {
  const points = [...d.matchAll(/(-?\d*\.?\d+)[,\s]+(-?\d*\.?\d+)/g)].map(
    (match) => [Number(match[1]), Number(match[2])] as const,
  );
  if (points.length < 3) {
    return 0;
  }
  let area = 0;
  for (let index = 0; index < points.length; index += 1) {
    const [x1, y1] = points[index];
    const [x2, y2] = points[(index + 1) % points.length];
    area += x1 * y2 - x2 * y1;
  }
  return area / 2;
}

/**
 * Returns `to` wound the same way as `from`.
 *
 * The check is on winding rather than on start-point distance because a
 * reversed winding is what produces the visible fold; a mismatched start point
 * only produces a rotation of the intermediate shape, which reads as motion
 * rather than as a defect.
 */
export function alignForMorph(from: string, to: string): string {
  return cacheGet(alignmentCache, `${from}||${to}`, () => {
    const fromArea = signedArea(from);
    const toArea = signedArea(to);
    if (fromArea === 0 || toArea === 0) {
      return to;
    }
    return Math.sign(fromArea) === Math.sign(toArea) ? to : reversePath(to);
  });
}

export type FitToBoxOptions = {
  /** Target box in path units. */
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  /** Keep the aspect ratio and centre inside the box. */
  preserveAspectRatio?: boolean;
};

/**
 * Rescales a path so its bounding box fills the given box.
 *
 * Morph pairs are almost never authored at the same size — an icon exported
 * from one file and a shape from another differ by an order of magnitude — and
 * the interpolation itself has no idea, so it renders a shape that also
 * violently changes size. Normalising both ends first is what makes an
 * arbitrary pair of paths morphable.
 */
export function fitToBox(
  d: string,
  {
    x = 0,
    y = 0,
    width = 100,
    height = 100,
    preserveAspectRatio = true,
  }: FitToBoxOptions = {},
): string {
  const box = getBoundingBox(d);
  const sourceWidth = Math.max(1e-6, box.x2 - box.x1);
  const sourceHeight = Math.max(1e-6, box.y2 - box.y1);

  const scaleX = width / sourceWidth;
  const scaleY = height / sourceHeight;
  const [sx, sy] = preserveAspectRatio
    ? [Math.min(scaleX, scaleY), Math.min(scaleX, scaleY)]
    : [scaleX, scaleY];

  // Scaling happens about the origin, so the path is moved to the origin first
  // and to its final position afterwards — scaling in place would drag a shape
  // authored far from the origin right out of the box.
  const atOrigin = translatePath(d, -box.x1, -box.y1);
  const scaled = scalePath(atOrigin, sx, sy);

  const drawnWidth = sourceWidth * sx;
  const drawnHeight = sourceHeight * sy;

  return translatePath(
    scaled,
    x + (width - drawnWidth) / 2,
    y + (height - drawnHeight) / 2,
  );
}

export type MorphOptions = {
  /** Match windings before interpolating. Leave on unless the morph looks tame. */
  align?: boolean;
  /** Normalise both paths into this box first. */
  fit?: FitToBoxOptions | false;
};

/**
 * Prepares a morph pair once. Call this in a `useMemo`, then feed `morphPath`.
 *
 * Splitting preparation from evaluation matters: preparation is the expensive,
 * frame-independent half, and evaluation is what runs 30 times a second.
 */
export function prepareMorph(
  from: string,
  to: string,
  { align = true, fit = false }: MorphOptions = {},
): MorphPair {
  const fittedFrom = fit ? fitToBox(normalizePath(from), fit) : normalizePath(from);
  const fittedTo = fit ? fitToBox(normalizePath(to), fit) : normalizePath(to);

  return {
    from: fittedFrom,
    to: align ? alignForMorph(fittedFrom, fittedTo) : fittedTo,
  };
}

/**
 * The path at `progress`, 0 = `from`, 1 = `to`.
 *
 * `progress` is clamped: an unclamped `interpolate()` upstream would otherwise
 * extrapolate the path past either end, which produces geometry that is valid
 * SVG and complete nonsense on screen.
 */
export function morphPath(progress: number, pair: MorphPair): string {
  const t = clamp01(progress);
  if (t <= 0) {
    return pair.from;
  }
  if (t >= 1) {
    return pair.to;
  }
  return interpolatePath(t, pair.from, pair.to);
}

/** One-shot convenience. Prefer `prepareMorph` + `morphPath` in a component. */
export function morphBetween(
  progress: number,
  from: string,
  to: string,
  options: MorphOptions = {},
): string {
  return morphPath(progress, prepareMorph(from, to, options));
}

/**
 * Morphs across a chain of shapes with one 0-1 progress.
 *
 * A continuously morphing blob is a loop through four or five shapes, not a
 * single A→B; expressing it as a sequence keeps the driver a plain
 * `frame / duration` ramp instead of per-segment frame arithmetic in every
 * caller.
 */
export function prepareMorphSequence(
  paths: readonly string[],
  { loop = false, ...options }: MorphOptions & { loop?: boolean } = {},
): MorphPair[] {
  const list = paths.filter(Boolean);
  if (list.length < 2) {
    return [];
  }
  // Closing the ring makes the last shape morph back to the first, so a looping
  // driver has no seam where it wraps from 1 to 0.
  const chain = loop ? [...list, list[0]] : list;
  return chain
    .slice(0, -1)
    .map((from, index) => prepareMorph(from, chain[index + 1], options));
}

export function morphSequence(progress: number, pairs: MorphPair[]): string {
  if (pairs.length === 0) {
    return "";
  }
  const t = clamp01(progress) * pairs.length;
  // The final frame must land on the last shape exactly, not on segment
  // `pairs.length` which does not exist.
  const segment = Math.min(pairs.length - 1, Math.floor(t));
  return morphPath(t - segment, pairs[segment]);
}

/**
 * Closed shapes on a shared 0-100 box, ready to morph into each other.
 *
 * They exist so a caller does not have to hand-author a matched pair to get a
 * morph on screen, and so every component that ships a "shapes" preset shows
 * the same circle.
 */
export const MORPH_SHAPES = {
  /** Four-arc circle. Kept as arcs so it reduces to the same curve count as the rest. */
  circle:
    "M 50 2 C 76.5 2 98 23.5 98 50 C 98 76.5 76.5 98 50 98 C 23.5 98 2 76.5 2 50 C 2 23.5 23.5 2 50 2 Z",
  square:
    "M 2 2 C 34 2 66 2 98 2 C 98 34 98 66 98 98 C 66 98 34 98 2 98 C 2 66 2 34 2 2 Z",
  squircle:
    "M 50 2 C 84 2 98 16 98 50 C 98 84 84 98 50 98 C 16 98 2 84 2 50 C 2 16 16 2 50 2 Z",
  triangle:
    "M 50 4 C 66 32 82 60 96 92 C 65 92 35 92 4 92 C 18 60 34 32 50 4 Z",
  diamond:
    "M 50 2 C 66 18 82 34 98 50 C 82 66 66 82 50 98 C 34 82 18 66 2 50 C 18 34 34 18 50 2 Z",
  blob: "M 50 6 C 76 10 94 26 92 52 C 90 78 70 96 48 94 C 24 92 6 74 8 48 C 10 24 26 4 50 6 Z",
} as const;

export type MorphShapeName = keyof typeof MORPH_SHAPES;
