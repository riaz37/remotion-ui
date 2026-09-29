import { noise3, resolveAnimatable, type Animatable, type Vec2 } from "./ae-motion";

/**
 * Cinema 4D MoGraph as pure functions: a cloner lays out copies, fields
 * measure how strongly each copy sits "inside" a region, and effectors turn
 * that strength into a transform, an opacity and a colour.
 *
 * Nothing here draws. The split matters: the same clone states can drive DOM
 * tiles, SVG marks or a WebGL instance buffer, and the maths is testable
 * without a browser.
 */

type A = Animatable<number>;
type AV = Animatable<Vec2>;
export type Vec3 = readonly [number, number, number];
type AV3 = Animatable<Vec3>;

export type ClonerLayout =
  | { mode: "grid"; columns: number; rows: number; spacing: number | Vec2 }
  /** Every other row shifted half a step — a honeycomb. */
  | { mode: "honeycomb"; columns: number; rows: number; spacing: number }
  | {
      mode: "radial";
      count: number;
      radius: number;
      /** Degrees; 0 is 12 o'clock. */
      startAngle?: number;
      /** Degrees covered. 360 closes the ring without doubling the last clone. */
      sweep?: number;
      /** Rotate each clone to face outward. */
      align?: boolean;
    }
  | {
      mode: "linear";
      count: number;
      step: Vec2;
      rotationStep?: number;
      scaleStep?: number;
    };

/** A clone at rest, before any effector. Centred on the cloner's origin. */
export type Clone = {
  index: number;
  count: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  /** 0–1 position in the layout: column/row for grids, order for the rest. */
  u: number;
  v: number;
};

const unitSpacing = (spacing: number | Vec2): Vec2 =>
  typeof spacing === "number" ? [spacing, spacing] : spacing;

export function layoutClones(layout: ClonerLayout): Clone[] {
  switch (layout.mode) {
    case "grid":
    case "honeycomb": {
      const columns = Math.max(1, Math.round(layout.columns));
      const rows = Math.max(1, Math.round(layout.rows));
      const [sx, sy] =
        layout.mode === "grid"
          ? unitSpacing(layout.spacing)
          : [layout.spacing, layout.spacing * (Math.sqrt(3) / 2)];
      const count = columns * rows;
      return Array.from({ length: count }, (_, index) => {
        const column = index % columns;
        const row = Math.floor(index / columns);
        const shift = layout.mode === "honeycomb" && row % 2 === 1 ? sx / 2 : 0;
        return {
          index,
          count,
          x: (column - (columns - 1) / 2) * sx + shift - (layout.mode === "honeycomb" ? sx / 4 : 0),
          y: (row - (rows - 1) / 2) * sy,
          rotation: 0,
          scale: 1,
          u: columns === 1 ? 0.5 : column / (columns - 1),
          v: rows === 1 ? 0.5 : row / (rows - 1),
        };
      });
    }
    case "radial": {
      const count = Math.max(1, Math.round(layout.count));
      const sweep = layout.sweep ?? 360;
      const closed = Math.abs(sweep) >= 360;
      const step = sweep / (closed ? count : Math.max(1, count - 1));
      return Array.from({ length: count }, (_, index) => {
        const degrees = (layout.startAngle ?? 0) + index * step;
        const radians = ((degrees - 90) * Math.PI) / 180;
        return {
          index,
          count,
          x: Math.cos(radians) * layout.radius,
          y: Math.sin(radians) * layout.radius,
          rotation: layout.align ? degrees : 0,
          scale: 1,
          u: count === 1 ? 0.5 : index / (count - 1),
          v: 0.5,
        };
      });
    }
    case "linear": {
      const count = Math.max(1, Math.round(layout.count));
      const mid = (count - 1) / 2;
      return Array.from({ length: count }, (_, index) => ({
        index,
        count,
        x: (index - mid) * layout.step[0],
        y: (index - mid) * layout.step[1],
        rotation: index * (layout.rotationStep ?? 0),
        scale: (layout.scaleStep ?? 1) ** index,
        u: count === 1 ? 0.5 : index / (count - 1),
        v: 0.5,
      }));
    }
    default:
      throw new Error(`mograph: unknown cloner mode "${(layout as { mode: string }).mode}".`);
  }
}

// ------------------------------------------------------------------- fields

type FieldCommon = {
  /** Flip the field: 1 outside, 0 inside. */
  invert?: boolean;
  /** 0–1 multiplier on the field's value. */
  strength?: A;
  /** How this field combines with the ones before it in the list. */
  blend?: "max" | "min" | "add" | "subtract" | "multiply";
};

export type FalloffField = FieldCommon &
  (
    | {
        shape: "spherical";
        center?: AV;
        radius: A;
        /** 0–1: share of the radius that ramps. 0 is a hard edge. */
        falloff?: A;
      }
    | {
        shape: "linear";
        /** A point on the plane where the ramp starts. */
        center?: AV;
        /** Direction the value rises toward, degrees (0 = +x). */
        angle?: A;
        /** Distance over which it rises from 0 to 1. */
        length: A;
      }
    | {
        shape: "noise";
        /** Pixels per noise cell. */
        scale?: A;
        /** Cells per second the field evolves. */
        speed?: A;
        seed?: number;
        /** Values above 1 push the field toward hard 0/1 patches. */
        contrast?: A;
      }
  );

export type FieldContext = { frame: number; fps: number };

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smoothstep = (edge0: number, edge1: number, x: number) => {
  if (edge1 <= edge0) return x < edge0 ? 0 : 1;
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

const num = (value: A | undefined, fallback: number, ctx: FieldContext) =>
  value === undefined ? fallback : resolveAnimatable(value, ctx.frame, { fps: ctx.fps });
const vec = (value: AV | undefined, fallback: Vec2, ctx: FieldContext): Vec2 =>
  value === undefined ? fallback : resolveAnimatable(value, ctx.frame, { fps: ctx.fps });

/** A field with every animatable resolved for one frame. */
type ResolvedField = (x: number, y: number) => number;

function resolveField(field: FalloffField, ctx: FieldContext): ResolvedField {
  const strength = clamp01(num(field.strength, 1, ctx));
  const finish = (value: number) => clamp01(field.invert ? 1 - value : value) * strength;

  switch (field.shape) {
    case "spherical": {
      const [cx, cy] = vec(field.center, [0, 0], ctx);
      const radius = Math.max(0, num(field.radius, 100, ctx));
      const inner = radius * (1 - clamp01(num(field.falloff, 0.5, ctx)));
      return (x, y) => finish(1 - smoothstep(inner, radius, Math.hypot(x - cx, y - cy)));
    }
    case "linear": {
      const [cx, cy] = vec(field.center, [0, 0], ctx);
      const radians = (num(field.angle, 0, ctx) * Math.PI) / 180;
      const dx = Math.cos(radians);
      const dy = Math.sin(radians);
      const length = Math.max(1e-6, num(field.length, 200, ctx));
      return (x, y) => finish(smoothstep(0, 1, ((x - cx) * dx + (y - cy) * dy) / length));
    }
    case "noise": {
      const scale = Math.max(1e-6, num(field.scale, 120, ctx));
      const time = (ctx.frame / ctx.fps) * num(field.speed, 0.5, ctx);
      const contrast = num(field.contrast, 1, ctx);
      const seed = Math.round(field.seed ?? 1);
      return (x, y) => finish(0.5 + noise3(x / scale, y / scale, time, seed) * contrast);
    }
    default:
      throw new Error(`mograph: unknown field shape "${(field as { shape: string }).shape}".`);
  }
}

function blendValues(mode: FieldCommon["blend"], previous: number, value: number): number {
  switch (mode) {
    case "min":
      return Math.min(previous, value);
    case "add":
      return clamp01(previous + value);
    case "subtract":
      return clamp01(previous - value);
    case "multiply":
      return previous * value;
    default:
      return Math.max(previous, value);
  }
}

/** Sample a stack of fields at a point. The first field sets the base. */
export function sampleFields(
  fields: readonly FalloffField[],
  x: number,
  y: number,
  ctx: FieldContext,
): number {
  return fields.reduce(
    (acc, field, index) => {
      const value = resolveField(field, ctx)(x, y);
      return index === 0 ? value : blendValues(field.blend, acc, value);
    },
    0,
  );
}

// ---------------------------------------------------------------- effectors

export type Effector = {
  /** No fields = full strength everywhere, like an effector with no falloff. */
  fields?: FalloffField[];
  /** Offset at full strength, pixels. z moves toward the camera. */
  position?: AV3;
  /** Scale factor at full strength. */
  scale?: A;
  /** Degrees about x, y, z at full strength. */
  rotation?: AV3;
  /** Opacity at full strength, 0–1. */
  opacity?: A;
  color?: string;
  /** 0–1 multiplier on the whole effector. */
  strength?: A;
};

export type CloneState = Clone & {
  z: number;
  rotationX: number;
  rotationY: number;
  /** Rest rotation plus effector z-rotation. */
  rotationZ: number;
  opacity: number;
  /** Colour layers in effector order; blend from the base colour through each. */
  tints: Array<{ color: string; weight: number }>;
  /** Strongest field value any effector saw at this clone. */
  weight: number;
};

/**
 * Run the effector stack over a set of clones. Fields are sampled at each
 * clone's rest position, so an effector that moves clones never changes which
 * clones the next effector selects — the result does not depend on how far
 * the first effector happened to push them.
 */
export function applyEffectors(
  clones: readonly Clone[],
  effectors: readonly Effector[],
  ctx: FieldContext,
): CloneState[] {
  const resolved = effectors.map((effector) => {
    const fields = (effector.fields ?? []).map((field) => ({ field, sample: resolveField(field, ctx) }));
    return {
      effector,
      fields,
      position: effector.position ? resolveAnimatable(effector.position, ctx.frame, { fps: ctx.fps }) : null,
      rotation: effector.rotation ? resolveAnimatable(effector.rotation, ctx.frame, { fps: ctx.fps }) : null,
      scale: num(effector.scale, 1, ctx),
      opacity: num(effector.opacity, 1, ctx),
      strength: clamp01(num(effector.strength, 1, ctx)),
    };
  });

  return clones.map((clone) =>
    resolved.reduce<CloneState>(
      (state, r) => {
        const field =
          r.fields.length === 0
            ? 1
            : r.fields.reduce(
                (acc, { field: f, sample }, index) =>
                  index === 0 ? sample(clone.x, clone.y) : blendValues(f.blend, acc, sample(clone.x, clone.y)),
                0,
              );
        const w = field * r.strength;
        if (w <= 0) return state;
        return {
          ...state,
          x: state.x + (r.position?.[0] ?? 0) * w,
          y: state.y + (r.position?.[1] ?? 0) * w,
          z: state.z + (r.position?.[2] ?? 0) * w,
          rotationX: state.rotationX + (r.rotation?.[0] ?? 0) * w,
          rotationY: state.rotationY + (r.rotation?.[1] ?? 0) * w,
          rotationZ: state.rotationZ + (r.rotation?.[2] ?? 0) * w,
          scale: state.scale * (1 + (r.scale - 1) * w),
          opacity: state.opacity * clamp01(1 + (r.opacity - 1) * w),
          tints: r.effector.color ? [...state.tints, { color: r.effector.color, weight: w }] : state.tints,
          weight: Math.max(state.weight, w),
        };
      },
      {
        ...clone,
        z: 0,
        rotationX: 0,
        rotationY: 0,
        rotationZ: clone.rotation,
        opacity: 1,
        tints: [],
        weight: 0,
      },
    ),
  );
}
