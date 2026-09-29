import { describe, expect, it } from "vitest";
import {
  applyEffectors,
  cloneOutline,
  projectClone,
  layoutClones,
  sampleFields,
  type Effector,
} from "../registry/bases/default/lib/mograph";

const ctx = { frame: 0, fps: 30 };

describe("cloner layouts", () => {
  it("centres a grid on the origin", () => {
    const clones = layoutClones({ mode: "grid", columns: 3, rows: 2, spacing: [10, 20] });
    expect(clones).toHaveLength(6);
    expect(clones[0]).toMatchObject({ x: -10, y: -10, u: 0, v: 0 });
    expect(clones[5]).toMatchObject({ x: 10, y: 10, u: 1, v: 1 });
  });

  it("closes a full radial ring without doubling the last clone", () => {
    const clones = layoutClones({ mode: "radial", count: 4, radius: 100, align: true });
    expect(clones[0].x).toBeCloseTo(0);
    expect(clones[0].y).toBeCloseTo(-100);
    expect(clones[1].x).toBeCloseTo(100);
    expect(clones[1].rotation).toBe(90);
  });

  it("spreads an open arc end to end", () => {
    const clones = layoutClones({ mode: "radial", count: 3, radius: 100, startAngle: -90, sweep: 180 });
    expect(clones[0].x).toBeCloseTo(-100);
    expect(clones[2].x).toBeCloseTo(100);
  });

  it("compounds scale along a linear cloner", () => {
    const clones = layoutClones({ mode: "linear", count: 3, step: [10, 0], scaleStep: 0.5 });
    expect(clones.map((c) => c.scale)).toEqual([1, 0.5, 0.25]);
    expect(clones[1].x).toBe(0);
  });

  it("offsets alternate honeycomb rows", () => {
    const clones = layoutClones({ mode: "honeycomb", columns: 2, rows: 2, spacing: 10 });
    expect(clones[2].x - clones[0].x).toBeCloseTo(5);
  });
});

describe("fields", () => {
  it("spherical is full inside, zero outside, smooth between", () => {
    const fields = [{ shape: "spherical" as const, radius: 100, falloff: 0.5 }];
    expect(sampleFields(fields, 0, 0, ctx)).toBe(1);
    expect(sampleFields(fields, 120, 0, ctx)).toBe(0);
    const edge = sampleFields(fields, 75, 0, ctx);
    expect(edge).toBeGreaterThan(0);
    expect(edge).toBeLessThan(1);
  });

  it("linear rises along its direction", () => {
    const fields = [{ shape: "linear" as const, angle: 0, length: 100 }];
    expect(sampleFields(fields, -10, 0, ctx)).toBe(0);
    expect(sampleFields(fields, 50, 999, ctx)).toBeCloseTo(0.5);
    expect(sampleFields(fields, 150, 0, ctx)).toBe(1);
  });

  it("noise is deterministic and evolves with time", () => {
    const fields = [{ shape: "noise" as const, scale: 50, speed: 1, seed: 3 }];
    const a = sampleFields(fields, 12, 34, { frame: 10, fps: 30 });
    expect(sampleFields(fields, 12, 34, { frame: 10, fps: 30 })).toBe(a);
    expect(sampleFields(fields, 12, 34, { frame: 40, fps: 30 })).not.toBe(a);
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThanOrEqual(1);
  });

  it("invert and strength shape the value", () => {
    const fields = [{ shape: "spherical" as const, radius: 100, invert: true, strength: 0.5 }];
    expect(sampleFields(fields, 0, 0, ctx)).toBe(0);
    expect(sampleFields(fields, 500, 0, ctx)).toBe(0.5);
  });

  it("blends a second field into the first", () => {
    const fields = [
      { shape: "spherical" as const, radius: 50, falloff: 0 },
      { shape: "spherical" as const, center: [200, 0] as const, radius: 50, falloff: 0, blend: "max" as const },
    ];
    expect(sampleFields(fields, 200, 0, ctx)).toBe(1);
    expect(sampleFields(fields, 100, 0, ctx)).toBe(0);
  });

  it("accepts keyframed centres", () => {
    const fields = [
      {
        shape: "spherical" as const,
        radius: 10,
        falloff: 0,
        center: [
          { frame: 0, value: [0, 0] as const },
          { frame: 10, value: [100, 0] as const },
        ],
      },
    ];
    expect(sampleFields(fields, 50, 0, { frame: 5, fps: 30 })).toBe(1);
    expect(sampleFields(fields, 0, 0, { frame: 5, fps: 30 })).toBe(0);
  });
});

describe("canvas projection", () => {
  const camera = { width: 800, height: 400, perspective: 1000, tilt: 0 };
  const rest = applyEffectors(layoutClones({ mode: "linear", count: 1, step: [0, 0] }), [], ctx)[0];
  const square = cloneOutline("square", 20);

  it("maps an untransformed clone to its CSS box", () => {
    const { points } = projectClone(rest, square, camera);
    expect(points[0][0]).toBeCloseTo(390);
    expect(points[0][1]).toBeCloseTo(190);
    expect(points[2][0]).toBeCloseTo(410);
    expect(points[2][1]).toBeCloseTo(210);
  });

  it("enlarges clones moved toward the camera by p / (p - z) about the perspective origin", () => {
    const { points, depth } = projectClone({ ...rest, z: 500 }, square, camera);
    // origin sits at 50% / 40%: (400, 160); the clone centre is (400, 200).
    expect(depth).toBe(500);
    expect(points[2][0] - points[0][0]).toBeCloseTo(40);
    expect((points[0][1] + points[2][1]) / 2).toBeCloseTo(160 + 40 * 2);
  });

  it("foreshortens a tilted plane and sorts by depth", () => {
    const near = projectClone({ ...rest, y: 100 }, square, { ...camera, tilt: 60 });
    const far = projectClone({ ...rest, y: -100 }, square, { ...camera, tilt: 60 });
    expect(near.depth).toBeGreaterThan(far.depth);
    const height = (p: typeof near) => p.points[2][1] - p.points[0][1];
    expect(height(near)).toBeLessThan(20);
    expect(height(near)).toBeGreaterThan(height(far));
  });

  it("turns a clone edge-on at 90 degrees about x", () => {
    // Seen from its own eye line (origin on the tile), an edge-on tile has no height.
    const { points } = projectClone({ ...rest, rotationX: 90 }, square, { ...camera, origin: [0.5, 0.5] });
    expect(Math.abs(points[2][1] - points[0][1])).toBeLessThan(0.5);
  });

  it("builds closed outlines for every shape", () => {
    expect(cloneOutline("square", 10)).toHaveLength(4);
    expect(cloneOutline("rounded", 10)).toHaveLength(16);
    expect(cloneOutline("circle", 10)).toHaveLength(20);
  });
});

describe("effectors", () => {
  const clones = layoutClones({ mode: "linear", count: 3, step: [100, 0] });

  it("applies the full effect inside the field and none outside", () => {
    const effector: Effector = {
      fields: [{ shape: "spherical", radius: 40, falloff: 0 }],
      position: [0, 0, 50],
      scale: 2,
      rotation: [0, 0, 90],
      opacity: 0.5,
      color: "#ff0000",
    };
    const [left, middle] = applyEffectors(clones, [effector], ctx);
    expect(middle).toMatchObject({ z: 50, scale: 2, rotationZ: 90, opacity: 0.5, weight: 1 });
    expect(middle.tints).toEqual([{ color: "#ff0000", weight: 1 }]);
    expect(left).toMatchObject({ z: 0, scale: 1, opacity: 1, weight: 0, tints: [] });
  });

  it("with no fields affects every clone", () => {
    const states = applyEffectors(clones, [{ position: [0, 10, 0] }], ctx);
    expect(states.every((s) => s.y === 10)).toBe(true);
  });

  it("stacks effectors in order", () => {
    const states = applyEffectors(clones, [{ scale: 2 }, { scale: 1.5 }, { position: [5, 0, 0] }], ctx);
    expect(states[0].scale).toBeCloseTo(3);
    expect(states[0].x).toBe(-95);
  });

  it("is deterministic", () => {
    const noise: Effector = { fields: [{ shape: "noise", scale: 60, seed: 2 }], position: [0, 0, 40] };
    expect(applyEffectors(clones, [noise], { frame: 33, fps: 30 })).toEqual(
      applyEffectors(clones, [noise], { frame: 33, fps: 30 }),
    );
  });

  it("reports unknown modes and shapes", () => {
    expect(() => layoutClones({ mode: "spiral" } as never)).toThrow(/unknown cloner mode/);
    expect(() => sampleFields([{ shape: "cube" } as never], 0, 0, ctx)).toThrow(/unknown field shape/);
  });
});
