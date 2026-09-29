import { describe, expect, it } from "vitest";
import { easesFromHandles, averageSpeed, motionPathLength } from "../../../packages/remotion-ui/src/import-ae/easing";
import { sampleTrack, applyToPoint, type Keyframe } from "../registry/bases/default/lib/ae-motion";
import { pathLength } from "../registry/bases/default/lib/bezier-path";
import {
  ellipse,
  evaluateContents,
  fill,
  group,
  rect,
  rectPath,
  repeater,
  samplePath,
  starPath,
  stroke,
  transformMatrix,
  trim,
  zigZag,
  zigZagPath,
  type RenderNode,
} from "../registry/bases/default/lib/lottie-shapes";
import { layerWorldMatrix, nullLayer, precompFrame, precompLayer, shapeLayer, spatial } from "../registry/bases/default/lib/ae-import";

const ctx = { frame: 0, fps: 30 };
const paints = (nodes: RenderNode[]): Extract<RenderNode, { kind: "paint" }>[] =>
  nodes.flatMap((n) => (n.kind === "paint" ? [n] : paints(n.children)));

/** lottie-web's normalised cubic-bezier easing, for reference. */
function lottieEase(h: { ox: number; oy: number; ix: number; iy: number }, x: number): number {
  const bez = (p1: number, p2: number, u: number) => 3 * (1 - u) ** 2 * u * p1 + 3 * (1 - u) * u * u * p2 + u ** 3;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 60; i += 1) {
    const mid = (lo + hi) / 2;
    if (bez(h.ox, h.ix, mid) < x) lo = mid;
    else hi = mid;
  }
  return bez(h.oy, h.iy, (lo + hi) / 2);
}

describe("import-ae easing through the real ae-motion", () => {
  it("scalar and vector tracks reproduce lottie-web's eased values", () => {
    const h = { ox: 0.25, oy: 0.1, ix: 0.25, iy: 1 };
    const fps = 24;
    const scalar = easesFromHandles(h, averageSpeed([10], [250], 36 / fps));
    const vector = easesFromHandles(h, averageSpeed([0, 0], [300, -400], 36 / fps));
    const sTrack: Keyframe<number>[] = [
      { frame: 12, value: 10, easeOut: scalar.easeOut },
      { frame: 48, value: 250, easeIn: scalar.easeIn },
    ];
    const vTrack: Keyframe<[number, number]>[] = [
      { frame: 12, value: [0, 0], easeOut: vector.easeOut },
      { frame: 48, value: [300, -400], easeIn: vector.easeIn },
    ];
    for (let f = 12; f <= 48; f += 3) {
      const p = lottieEase(h, (f - 12) / 36);
      expect(sampleTrack(sTrack, f, { fps })).toBeCloseTo(10 + 240 * p, 4);
      const [x, y] = sampleTrack(vTrack, f, { fps });
      expect(x).toBeCloseTo(300 * p, 4);
      expect(y).toBeCloseTo(-400 * p, 4);
    }
  });
});

describe("lottie-shapes", () => {
  it("builds rectangles from the right edge, clockwise, like lottie-web", () => {
    const cw = rectPath([0, 0], [100, 50], 0, "clockwise");
    expect(cw.segments.map((s) => [s.p0.x, s.p0.y])).toEqual([
      [50, -25],
      [50, 25],
      [-50, 25],
      [-50, -25],
    ]);
    const ccw = rectPath([0, 0], [100, 50], 0, "counter-clockwise");
    expect(ccw.segments[1].p0).toEqual({ x: -50, y: -25 });
  });

  it("builds stars from the top with alternating radii", () => {
    const s = starPath({ kind: "star", center: [0, 0], points: 5, outerRadius: 100, innerRadius: 40, outerRoundness: 0, innerRoundness: 0, rotation: 0, direction: "clockwise" });
    expect(s.segments).toHaveLength(10);
    expect(s.segments[0].p0.x).toBeCloseTo(0);
    expect(s.segments[0].p0.y).toBeCloseTo(-100);
    expect(Math.hypot(s.segments[1].p0.x, s.segments[1].p0.y)).toBeCloseTo(40);
  });

  it("a style paints every path above it, nested groups included, in its own space", () => {
    const nodes = evaluateContents(
      [group("Inner", [rect({ size: [10, 10] })], { position: [100, 0] }), ellipse({ size: [4, 4] }), fill({ color: "#00ff00" })],
      ctx,
    );
    const [paint] = paints(nodes);
    expect(paint.paint.color).toBe("#00ff00");
    // The inner group's +100 is baked into the path, since the fill sits outside it.
    expect(paint.d).toMatch(/^M105 -5/);
    expect(paint.d.match(/M/g)).toHaveLength(2);
  });

  it("paints bottom items first, so the first item ends up on top", () => {
    const nodes = evaluateContents(
      [group("Top", [rect({ size: [10, 10] }), fill({ color: "#ff0000" })]), group("Bottom", [rect({ size: [10, 10] }), fill({ color: "#0000ff" })])],
      ctx,
    );
    expect(paints(nodes).map((p) => p.paint.color)).toEqual(["#0000ff", "#ff0000"]);
  });

  it("a trim below a style still trims what the style draws", () => {
    const line = { closed: false, vertices: [[0, 0], [100, 0]] as [number, number][], inTangents: [[0, 0], [0, 0]] as [number, number][], outTangents: [[0, 0], [0, 0]] as [number, number][] };
    const nodes = evaluateContents(
      [{ type: "path", path: line }, stroke({ color: "#000000", width: 2 }), trim({ start: 0, end: 0.25 })],
      ctx,
    );
    const end = Number(/ ([0-9.]+) 0$/.exec(paints(nodes)[0].d)?.[1]);
    expect(paints(nodes)[0].d.startsWith("M0 0C")).toBe(true);
    expect(end).toBeCloseTo(25, 0);
  });

  it("repeats everything above it, styles included, with the opacity ramp", () => {
    const nodes = evaluateContents(
      [
        rect({ size: [10, 10] }),
        fill({ color: "#000000" }),
        repeater({ copies: 3, composite: "above", transform: { position: [20, 0], startOpacity: 1, endOpacity: 0.5 } }),
      ],
      ctx,
    );
    const copies = nodes.filter((n) => n.kind === "group") as Extract<RenderNode, { kind: "group" }>[];
    expect(copies).toHaveLength(3);
    // Painted bottom first: with `above`, copy 0 (index 0) is drawn last.
    expect(copies.map((c) => c.matrix[4])).toEqual([40, 20, 0]);
    expect(copies.map((c) => c.opacity)).toEqual([0.5, 0.75, 1]);
  });

  it("zig-zag moves the vertices too, even with zero ridges", () => {
    const square = rectPath([0, 0], [100, 100], 0, "clockwise");
    const zz = zigZagPath(square, 10, 0, false);
    const moved = zz.segments.some((s, i) => Math.hypot(s.p0.x - square.segments[i % 4].p0.x, s.p0.y - square.segments[i % 4].p0.y) > 5);
    expect(moved).toBe(true);
    const ridged = zigZagPath(square, 10, 3, false);
    expect(ridged.segments.length).toBe(4 * 4 + 1);
    expect(evaluateContents([rect({ size: [100, 100] }), zigZag({ size: 0, ridges: 3 }), fill({ color: "#000" })], ctx)).toHaveLength(1);
  });

  it("blends path keyframes through ae-motion easing", () => {
    const a = { closed: false, vertices: [[0, 0], [10, 0]] as [number, number][], inTangents: [[0, 0], [0, 0]] as [number, number][], outTangents: [[0, 0], [0, 0]] as [number, number][] };
    const b = { ...a, vertices: [[0, 0], [20, 0]] as [number, number][] };
    const keys = [
      { frame: 0, value: a, interpolation: "linear" as const },
      { frame: 10, value: b },
    ];
    expect(samplePath(keys, 5, 30).vertices[1][0]).toBeCloseTo(15);
    expect(samplePath(keys, 20, 30).vertices[1][0]).toBe(20);
  });

  it("matches lottie-web's skew-from-axis matrix", () => {
    const sk = 20;
    const sa = 30;
    const m = transformMatrix({ skew: sk, skewAxis: sa }, ctx);
    // lottie-web: R(-sa) · shear(tan(-sk)) · R(sa), column-vector form.
    const r = (d: number) => [Math.cos((d * Math.PI) / 180), Math.sin((d * Math.PI) / 180)];
    const [c1, s1] = r(sa);
    const t = Math.tan((-sk * Math.PI) / 180);
    const apply = ([x, y]: [number, number]) => {
      const [x1, y1] = [c1 * x - s1 * y, s1 * x + c1 * y];
      const [x2, y2] = [x1 + t * y1, y1];
      return [c1 * x2 + s1 * y2, -s1 * x2 + c1 * y2];
    };
    const [ex, ey] = apply([10, 5]);
    const [ax, ay] = applyToPoint(m, [10, 5]);
    expect(ax).toBeCloseTo(ex, 9);
    expect(ay).toBeCloseTo(ey, 9);
  });

  it("measures real geometry for trim input", () => {
    expect(pathLength(rectPath([0, 0], [100, 50], 0, "clockwise"))).toBeCloseTo(300, 3);
  });
});

describe("ae-import layers", () => {
  it("parents compose at the same composition frame", () => {
    const rig = nullLayer({ name: "Rig", inPoint: 0, outPoint: 60, transform: { position: [{ frame: 0, value: [0, 0], interpolation: "linear" }, { frame: 10, value: [100, 0] }] } });
    const child = shapeLayer({ name: "Dot", parent: rig, inPoint: 0, outPoint: 60, transform: { position: [5, 5] }, contents: [] });
    const m = layerWorldMatrix(child, 5, 30);
    expect(applyToPoint(m, [0, 0])).toEqual([55, 5]);
  });

  it("keeps the ease on a motion path that returns to its start", () => {
    // Codegen measures spatial speed along the path; mirror it here.
    const h = { ox: 0.6, oy: 0.1, ix: 0.4, iy: 0.9 };
    const keysFor = (length: number) => {
      const { easeOut, easeIn } = easesFromHandles(h, length / 1);
      return [
        { frame: 0, value: [0, 0] as [number, number], spatialOut: [100, -100] as [number, number], easeOut },
        { frame: 30, value: [0, 0] as [number, number], spatialIn: [100, 100] as [number, number], easeIn },
      ];
    };
    const length = motionPathLength([0, 0], [0, 0], [100, -100], [100, 100]);
    const position = spatial(keysFor(length));
    // Walk the same polyline to the eased distance and compare.
    const expectedAt = (progress: number) => {
      const loose = spatial([
        { frame: 0, value: [0, 0], spatialOut: [100, -100], interpolation: "linear" },
        { frame: 30, value: [0, 0], spatialIn: [100, 100] },
      ]);
      return loose({ frame: progress * 30, time: 0, fps: 30 });
    };
    for (const f of [6, 12, 21]) {
      const [x, y] = position({ frame: f, time: f / 30, fps: 30 });
      const [ex, ey] = expectedAt(lottieEase(h, f / 30));
      expect(x).toBeCloseTo(ex, 3);
      expect(y).toBeCloseTo(ey, 3);
    }
    // And it really is eased: not where linear timing would put it.
    const [lx] = expectedAt(12 / 30);
    expect(Math.abs(position({ frame: 12, time: 0.4, fps: 30 })[0] - lx)).toBeGreaterThan(1);
  });

  it("clamps a time remap landing exactly on the precomp's out point, like lottie-web", () => {
    const base = { name: "Pre", inPoint: 0, outPoint: 60, width: 100, height: 100 };
    expect(precompFrame(precompLayer({ ...base, timeRemap: 60 }), 10, 30)).toBe(59);
    expect(precompFrame(precompLayer({ ...base, timeRemap: 42 }), 10, 30)).toBe(42);
    expect(precompFrame(precompLayer({ ...base, startTime: 10, timeStretch: 2 }), 30, 30)).toBe(10);
  });

  it("follows a curved motion path by arc length", () => {
    const position = spatial([
      { frame: 0, value: [0, 0], spatialOut: [0, -100], interpolation: "linear" },
      { frame: 10, value: [100, 0], spatialIn: [0, -100] },
    ]);
    const [x, y] = position({ frame: 5, time: 5 / 30, fps: 30 });
    expect(x).toBeCloseTo(50, 0);
    expect(y).toBeCloseTo(-75, 0);
    expect(position({ frame: 10, time: 1 / 3, fps: 30 })).toEqual([100, 0]);
  });
});
