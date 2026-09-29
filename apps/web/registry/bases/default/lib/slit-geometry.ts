/**
 * Slit-scan geometry: split a frame into strips, give each strip a time
 * delay, and group strips that share a delay so each group costs one render
 * of the child. Pure — the component turns each group into a `<Freeze>` and a
 * clip path.
 *
 * The cost of a slit-scan is the number of *distinct delays* on screen, not
 * the number of strips: 120 fine rows over 16 delay levels is 16 renders of
 * the child per frame. That is the knob that matters, and it is `levels`.
 */

export type SlitMode = "bands" | "radial";

export type SlitOptions = {
  width: number;
  height: number;
  mode?: SlitMode;
  /** Number of strips (bands or rings). */
  strips?: number;
  /**
   * Bands only: direction the delay grows along, degrees. 0 = left to right
   * (vertical slits), 90 = top to bottom (horizontal slits).
   */
  angle?: number;
  /** Radial only: centre as shares of the frame. */
  center?: readonly [number, number];
  /** Delay of the last strip, in frames. */
  maxDelay: number;
  /** Distinct delays (child renders) at most. */
  levels?: number;
  /** Maps strip position 0–1 to delay share 0–1. Default: linear. */
  curve?: (t: number) => number;
};

export type SlitGroup = {
  /** Frames this group lags behind. */
  delay: number;
  /** CSS `clip-path` for every strip in the group, in px of the frame. */
  clipPath: string;
  /** Strips in the group. */
  strips: number;
};

const fmt = (n: number) => +n.toFixed(2);

function bandPath(width: number, height: number, angle: number, from: number, to: number): string {
  // Strip between two lines perpendicular to the direction, extended well
  // past the frame; the element's own box does the rest of the clipping.
  const a = (angle * Math.PI) / 180;
  const u = [Math.cos(a), Math.sin(a)];
  const v = [-u[1], u[0]];
  const cx = width / 2;
  const cy = height / 2;
  const far = Math.hypot(width, height);
  const p = (s: number, t: number) => `${fmt(cx + u[0] * s + v[0] * t)} ${fmt(cy + u[1] * s + v[1] * t)}`;
  return `M${p(from, -far)} L${p(to, -far)} L${p(to, far)} L${p(from, far)} Z`;
}

function circlePath(cx: number, cy: number, r: number): string {
  if (r <= 0) return "";
  return `M${fmt(cx - r)} ${fmt(cy)} A${fmt(r)} ${fmt(r)} 0 1 0 ${fmt(cx + r)} ${fmt(cy)} A${fmt(r)} ${fmt(r)} 0 1 0 ${fmt(cx - r)} ${fmt(cy)} Z`;
}

/** Strip extents along the delay axis (bands) or radius (rings), in px. */
function stripExtents(o: Required<Omit<SlitOptions, "curve">>): Array<[number, number]> {
  const n = o.strips;
  if (o.mode === "radial") {
    const cx = o.center[0] * o.width;
    const cy = o.center[1] * o.height;
    const reach = Math.max(
      Math.hypot(cx, cy),
      Math.hypot(o.width - cx, cy),
      Math.hypot(cx, o.height - cy),
      Math.hypot(o.width - cx, o.height - cy),
    );
    return Array.from({ length: n }, (_, k) => [(reach * k) / n, (reach * (k + 1)) / n]);
  }
  const a = (o.angle * Math.PI) / 180;
  const half = (Math.abs(Math.cos(a)) * o.width + Math.abs(Math.sin(a)) * o.height) / 2;
  return Array.from({ length: n }, (_, k) => [-half + (2 * half * k) / n, -half + (2 * half * (k + 1)) / n]);
}

export function slitGroups(options: SlitOptions): SlitGroup[] {
  const o = {
    mode: "bands" as SlitMode,
    strips: 48,
    angle: 0,
    center: [0.5, 0.5] as const,
    levels: 16,
    ...options,
  };
  if (!(o.width > 0) || !(o.height > 0)) throw new Error("slit-scan: width and height must be positive.");
  if (!(o.strips >= 1)) throw new Error("slit-scan: strips must be at least 1.");
  const strips = Math.round(o.strips);
  const levels = Math.max(1, Math.round(o.levels));
  const curve = options.curve ?? ((t: number) => t);
  const extents = stripExtents({ ...o, strips, levels });

  const groups = new Map<number, string[]>();
  extents.forEach(([from, to], k) => {
    const t = strips === 1 ? 0 : k / (strips - 1);
    const share = Math.min(1, Math.max(0, curve(t)));
    // Quantise to `levels` evenly spaced delays: this is what bounds the cost.
    const level = levels === 1 ? 0 : Math.round(share * (levels - 1)) / (levels - 1);
    // Fractional on purpose: a child turning several degrees a frame would
    // step visibly between rings if delays snapped to whole frames.
    const delay = level * o.maxDelay;
    const piece =
      o.mode === "radial"
        ? `${circlePath(o.center[0] * o.width, o.center[1] * o.height, to)} ${circlePath(o.center[0] * o.width, o.center[1] * o.height, from)}`
        : bandPath(o.width, o.height, o.angle, from, to);
    groups.set(delay, [...(groups.get(delay) ?? []), piece]);
  });

  return [...groups.entries()]
    .sort(([a], [b]) => a - b)
    .map(([delay, pieces]) => ({
      delay,
      strips: pieces.length,
      clipPath: `path(evenodd, "${pieces.join(" ").trim()}")`,
    }));
}
