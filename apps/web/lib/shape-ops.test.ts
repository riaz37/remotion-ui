import { describe, expect, it } from "vitest";
import {
  parseD,
  pathLength,
  signedArea,
  slicePath,
  toD,
  vertexCentroid,
} from "../registry/bases/default/lib/bezier-path";
import {
  evaluateShapeStack,
  offsetPath,
  type ShapeOperator,
  type ShapeSource,
} from "../registry/bases/default/lib/shape-ops";

const square: ShapeSource = { type: "path", d: "M0 0 L100 0 L100 100 L0 100 Z" };
const line: ShapeSource = { type: "path", d: "M0 0 L100 0" };
const run = (shapes: ShapeSource[], operators: ShapeOperator[] = [], frame = 0) =>
  evaluateShapeStack({ shapes, operators, frame, fps: 30 });
const totalLength = (items: ReturnType<typeof run>) =>
  items.reduce((sum, item) => sum + pathLength(item.path), 0);

describe("bezier-path", () => {
  it("parses relative commands, arcs and closes paths via @remotion/paths", () => {
    const [path] = parseD("M0 0 h100 v100 h-100 z");
    expect(path.closed).toBe(true);
    expect(path.segments).toHaveLength(4);
    expect(pathLength(path)).toBeCloseTo(400, 3);
    const [arc] = parseD("M0 0 A50 50 0 0 1 100 0");
    expect(pathLength(arc)).toBeCloseTo(Math.PI * 50, 0);
  });

  it("splits multiple subpaths", () => {
    expect(parseD("M0 0 L10 0 M20 0 L30 0")).toHaveLength(2);
  });

  it("slices by arc length", () => {
    const [path] = parseD("M0 0 L100 0");
    const piece = slicePath(path, 25, 75);
    expect(pathLength(piece)).toBeCloseTo(50, 3);
    expect(piece.segments[0].p0.x).toBeCloseTo(25, 3);
  });

  it("round-trips through d", () => {
    const [path] = parseD("M0 0 L100 0 L100 100 Z");
    const [again] = parseD(toD(path));
    expect(pathLength(again)).toBeCloseTo(pathLength(path), 3);
    expect(again.closed).toBe(true);
  });

  it("reports winding so offset can grow shapes either way", () => {
    const [cw] = parseD("M0 0 L100 0 L100 100 L0 100 Z");
    const [ccw] = parseD("M0 0 L0 100 L100 100 L100 0 Z");
    expect(Math.sign(signedArea(cw))).toBe(-Math.sign(signedArea(ccw)));
  });
});

describe("shape sources", () => {
  it("builds an ellipse with the right circumference", () => {
    const [item] = run([{ type: "ellipse", size: [200, 200] }]);
    expect(pathLength(item.path)).toBeCloseTo(Math.PI * 200, 0);
  });

  it("builds stars with 2n vertices around the centre", () => {
    const [item] = run([{ type: "star", points: 5, outerRadius: 100, innerRadius: 40 }]);
    expect(item.path.segments).toHaveLength(10);
    const c = vertexCentroid(item.path);
    expect(Math.abs(c.x)).toBeLessThan(1e-6);
  });

  it("accepts keyframed parameters", () => {
    const shape: ShapeSource = {
      type: "ellipse",
      size: [
        { frame: 0, value: [0, 0] },
        { frame: 10, value: [200, 200] },
      ],
    };
    const [item] = run([shape], [], 5);
    expect(pathLength(item.path)).toBeCloseTo(Math.PI * 100, 0);
  });
});

describe("trim paths", () => {
  it("keeps the requested share of the length", () => {
    const items = run([square], [{ op: "trim", start: 0.25, end: 0.75 }]);
    expect(totalLength(items)).toBeCloseTo(200, 2);
  });

  it("wraps across the seam of a closed path as one stroke", () => {
    const items = run([square], [{ op: "trim", start: 0, end: 0.5, offset: 0.75 }]);
    expect(items).toHaveLength(1);
    expect(totalLength(items)).toBeCloseTo(200, 2);
  });

  it("returns nothing for an empty range", () => {
    expect(run([square], [{ op: "trim", start: 0.4, end: 0.4 }])).toHaveLength(0);
  });

  it("simultaneous trims every path by the same share", () => {
    const items = run([line, line], [{ op: "trim", start: 0, end: 0.5 }]);
    expect(items.map((i) => pathLength(i.path))).toEqual([expect.closeTo(50, 2), expect.closeTo(50, 2)]);
  });

  it("individual trims the paths as one line, in order", () => {
    const items = run([line, line], [{ op: "trim", start: 0, end: 0.5, mode: "individual" }]);
    expect(items).toHaveLength(1);
    expect(pathLength(items[0].path)).toBeCloseTo(100, 2);
  });
});

describe("repeater", () => {
  it("makes copies with an opacity ramp", () => {
    const items = run([line], [
      { op: "repeater", copies: 3, position: [0, 10], startOpacity: 1, endOpacity: 0.2, composite: "above" },
    ]);
    expect(items).toHaveLength(3);
    expect(items[0].opacity).toBeCloseTo(1);
    expect(items[2].opacity).toBeCloseTo(0.2);
    expect(items[2].path.segments[0].p0.y).toBeCloseTo(20);
  });

  it("fades the last copy in for fractional counts", () => {
    const items = run([line], [{ op: "repeater", copies: 2.25, composite: "above" }]);
    expect(items).toHaveLength(3);
    expect(items[2].opacity).toBeCloseTo(0.25);
  });

  it("stacks new copies underneath by default", () => {
    const items = run([line], [{ op: "repeater", copies: 3, position: [0, 10] }]);
    expect(items[0].copy).toBe(2);
  });

  it("puts copies on a circle with the anchor as pivot", () => {
    const items = run([{ type: "ellipse", center: [0, -100], size: [10, 10] }], [
      { op: "repeater", copies: 4, position: [0, 0], rotation: 90, composite: "above" },
    ]);
    const c = vertexCentroid(items[1].path);
    expect(c.x).toBeCloseTo(100, 3);
    expect(c.y).toBeCloseTo(0, 3);
  });
});

describe("operator order", () => {
  it("trim below a repeater draws across copies; above it trims each copy", () => {
    const repeater: ShapeOperator = { op: "repeater", copies: 4, position: [0, 10], composite: "above" };
    const trim: ShapeOperator = { op: "trim", start: 0, end: 0.5, mode: "individual" };
    const below = run([line], [repeater, trim]);
    const above = run([line], [trim, repeater]);
    expect(below).toHaveLength(2);
    expect(above).toHaveLength(4);
    expect(totalLength(below)).toBeCloseTo(200, 2);
    expect(totalLength(above)).toBeCloseTo(200, 2);
  });
});

describe("path operators", () => {
  it("pucker and bloat move vertices and handles in opposite directions", () => {
    const [bloated] = run([square], [{ op: "pucker-bloat", amount: 0.5 }]);
    const s = bloated.path.segments[0];
    expect(s.p0.x).toBeCloseTo(25);
    expect(s.c1.y).toBeLessThan(0);
  });

  it("offset grows a closed shape regardless of winding", () => {
    const [cw] = parseD("M0 0 L100 0 L100 100 L0 100 Z");
    const [ccw] = parseD("M0 0 L0 100 L100 100 L100 0 Z");
    expect(pathLength(offsetPath(cw, 10))).toBeGreaterThan(pathLength(cw) + 60);
    expect(pathLength(offsetPath(ccw, 10))).toBeGreaterThan(pathLength(ccw) + 60);
    // An exact inset: no swallowtail loops left at the concave corners.
    expect(Math.abs(pathLength(offsetPath(cw, -10)) - 320)).toBeLessThan(1);
    expect(Math.abs(pathLength(offsetPath(ccw, -10)) - 320)).toBeLessThan(1);
    expect(Math.abs(pathLength(offsetPath(cw, 10, "miter")) - 480)).toBeLessThan(1);
  });

  it("offset copies produce concentric rings", () => {
    const items = run([{ type: "ellipse", size: [100, 100] }], [{ op: "offset", amount: 10, copies: 3 }]);
    expect(items).toHaveLength(3);
    const lengths = items.map((item) => pathLength(item.path));
    expect(lengths[1]).toBeGreaterThan(lengths[0]);
    expect(lengths[2]).toBeGreaterThan(lengths[1]);
    // Rings are indexed as copies so a colour ramp runs across them.
    expect(items.map((item) => [item.copy, item.copies])).toEqual([[0, 3], [1, 3], [2, 3]]);
  });

  it("zig-zag adds alternating ridges and keeps the vertices", () => {
    const [zig] = run([line], [{ op: "zigzag", size: 10, ridges: 4 }]);
    expect(zig.path.segments).toHaveLength(5);
    expect(zig.path.segments[0].p0.y).toBeCloseTo(0);
    expect(Math.abs(zig.path.segments[0].p1.y)).toBeCloseTo(10);
    expect(Math.sign(zig.path.segments[0].p1.y)).toBe(-Math.sign(zig.path.segments[1].p1.y));
  });

  it("wiggle paths is deterministic and moves over time", () => {
    const op: ShapeOperator = { op: "wiggle", size: 12, detail: 4, seed: 3 };
    const a = toD(run([square], [op], 10)[0].path);
    expect(toD(run([square], [op], 10)[0].path)).toBe(a);
    expect(toD(run([square], [op], 20)[0].path)).not.toBe(a);
  });

  it("wiggle with full correlation moves the path rigidly", () => {
    const [moved] = run([line], [{ op: "wiggle", size: 20, detail: 3, correlation: 1, seed: 2 }], 17);
    const dy = moved.path.segments.map((s) => s.p0.y);
    dy.forEach((y) => expect(y).toBeCloseTo(dy[0], 6));
  });

  it("reports unknown operators clearly", () => {
    expect(() => run([line], [{ op: "nope" } as unknown as ShapeOperator])).toThrow(/unknown operator/);
  });
});
