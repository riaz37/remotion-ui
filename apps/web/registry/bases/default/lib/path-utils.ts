import {
  evolvePath,
  getBoundingBox,
  getLength,
  getPointAtLength,
  getTangentAtLength,
} from "@remotion/paths";

export type PathPoint = {
  x: number;
  y: number;
};

/** Point on a path plus the heading of the curve at that point, in degrees. */
export type PathSample = PathPoint & {
  angle: number;
};

/**
 * Measuring a path parses its `d` string, which is far too expensive to redo
 * for every path on every frame. Paths are static strings, so results are
 * cached by the string itself.
 */
const lengthCache = new Map<string, number>();
const boxCache = new Map<string, ReturnType<typeof getBoundingBox>>();

export function pathLength(d: string): number {
  const cached = lengthCache.get(d);
  if (cached !== undefined) {
    return cached;
  }
  const length = getLength(d);
  lengthCache.set(d, length);
  return length;
}

export function pathBoundingBox(d: string) {
  const cached = boxCache.get(d);
  if (cached !== undefined) {
    return cached;
  }
  const box = getBoundingBox(d);
  boxCache.set(d, box);
  return box;
}

export function clampProgress(progress: number) {
  return Math.min(1, Math.max(0, progress));
}

export function getPathDrawStyles(progress: number, path: string) {
  const evolution = evolvePath(clampProgress(progress), path);
  return {
    strokeDasharray: evolution.strokeDasharray,
    strokeDashoffset: evolution.strokeDashoffset,
  };
}

/**
 * A viewBox that tightly frames the artwork, so callers can hand over any path
 * — a logo exported at the origin or one sitting at x=940 in a 1024 canvas —
 * without hand-computing coordinates. `padding` is in path units and leaves
 * room for the stroke, which straddles the geometry and would otherwise clip.
 */
export function fitViewBox(paths: string | string[], padding = 0): string {
  const list = (Array.isArray(paths) ? paths : [paths]).filter(Boolean);
  const boxes = list.map(pathBoundingBox);

  if (boxes.length === 0) {
    return "0 0 100 100";
  }

  const x1 = Math.min(...boxes.map((box) => box.x1));
  const y1 = Math.min(...boxes.map((box) => box.y1));
  const x2 = Math.max(...boxes.map((box) => box.x2));
  const y2 = Math.max(...boxes.map((box) => box.y2));

  return [
    x1 - padding,
    y1 - padding,
    Math.max(1, x2 - x1 + padding * 2),
    Math.max(1, y2 - y1 + padding * 2),
  ].join(" ");
}

/**
 * Sample a path by arc length rather than by segment index, so a cursor or a
 * comet head travels at an even speed no matter how the path was authored.
 */
export function samplePath(d: string, progress: number): PathSample {
  const length = pathLength(d);
  const at = clampProgress(progress) * length;
  // Both return null for a path with no drawable segments (an empty `d`, or a
  // lone moveto), which is a valid input a caller can build from waypoints.
  const point = getPointAtLength(d, at) ?? { x: 0, y: 0 };
  const tangent = getTangentAtLength(d, at) ?? { x: 1, y: 0 };

  return {
    x: point.x,
    y: point.y,
    angle: (Math.atan2(tangent.y, tangent.x) * 180) / Math.PI,
  };
}

/**
 * Build a path through waypoints. `smoothing` of 0 gives straight hops; higher
 * values round the corners with a cardinal spline whose control points are
 * derived from the neighbouring points, so the curve stays close to the line.
 */
export function waypointsToPath(
  points: readonly PathPoint[],
  smoothing = 0.25,
): string {
  if (points.length === 0) {
    return "";
  }
  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }

  const segments = [`M ${points[0].x} ${points[0].y}`];

  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = points[index - 1] ?? points[index];
    const from = points[index];
    const to = points[index + 1];
    const next = points[index + 2] ?? to;

    if (smoothing <= 0) {
      segments.push(`L ${to.x} ${to.y}`);
      continue;
    }

    const c1 = {
      x: from.x + ((to.x - previous.x) / 2) * smoothing,
      y: from.y + ((to.y - previous.y) / 2) * smoothing,
    };
    const c2 = {
      x: to.x - ((next.x - from.x) / 2) * smoothing,
      y: to.y - ((next.y - from.y) / 2) * smoothing,
    };

    segments.push(`C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${to.x} ${to.y}`);
  }

  return segments.join(" ");
}

/**
 * Arc-length progress at which each waypoint sits, so callers can fire events
 * — a click, a label — exactly when the traveller reaches a point instead of
 * at a guessed frame. Smoothing moves a waypoint off the straight line, so the
 * nearest sample is found by scanning rather than by segment ratio.
 */
export function waypointProgress(
  d: string,
  points: readonly PathPoint[],
  samples = 240,
): number[] {
  const length = pathLength(d);
  if (length === 0) {
    return points.map(() => 0);
  }

  return points.map((point) => {
    let bestProgress = 0;
    let bestDistance = Infinity;

    for (let step = 0; step <= samples; step += 1) {
      const progress = step / samples;
      const sample = getPointAtLength(d, progress * length);
      if (!sample) {
        continue;
      }
      const distance = (sample.x - point.x) ** 2 + (sample.y - point.y) ** 2;
      if (distance < bestDistance) {
        bestDistance = distance;
        bestProgress = progress;
      }
    }

    return bestProgress;
  });
}
