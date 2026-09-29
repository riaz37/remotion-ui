import { describe, expect, it } from "vitest";
import { fitPolyline } from "../registry/bases/default/lib/curve-fit";
import { parseD, pathLength, pointAt, type BezierPath, type Pt } from "../registry/bases/default/lib/bezier-path";
import { evaluateShapeStack, offsetPath } from "../registry/bases/default/lib/shape-ops";

/** Dense samples along every segment, for distance checks. */
function samples(path: BezierPath, perSegment = 24): Pt[] {
  return path.segments.flatMap((s) => Array.from({ length: perSegment }, (_, i) => pointAt(s, i / perSegment)));
}

function distanceToPolyline(p: Pt, poly: readonly Pt[], closed: boolean): number {
  let best = Infinity;
  const count = closed ? poly.length : poly.length - 1;
  for (let i = 0; i < count; i += 1) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1)));
    best = Math.min(best, Math.hypot(p.x - (a.x + dx * t), p.y - (a.y + dy * t)));
  }
  return best;
}

describe("fitPolyline", () => {
  it("fits a dense circle with a few curves inside tolerance", () => {
    const poly = Array.from({ length: 360 }, (_, i) => ({
      x: Math.cos((i / 360) * Math.PI * 2) * 100,
      y: Math.sin((i / 360) * Math.PI * 2) * 100,
    }));
    const fitted = fitPolyline(poly, true, 0.3);
    expect(fitted.segments.length).toBeLessThanOrEqual(12);
    for (const p of samples(fitted)) expect(Math.abs(Math.hypot(p.x, p.y) - 100)).toBeLessThan(0.5);
  });

  it("keeps corners sharp", () => {
    const square = [
      { x: 0, y: 0 },
      { x: 50, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ];
    const fitted = fitPolyline(square, true);
    const vertices = fitted.segments.map((s) => `${Math.round(s.p0.x)},${Math.round(s.p0.y)}`);
    expect(vertices).toEqual(expect.arrayContaining(["0,0", "100,0", "100,100", "0,100"]));
    expect(pathLength(fitted)).toBeCloseTo(400, 1);
  });

  it("stays within tolerance of an arbitrary open polyline", () => {
    const poly = Array.from({ length: 200 }, (_, i) => ({ x: i * 2, y: Math.sin(i / 12) * 40 }));
    const fitted = fitPolyline(poly, false, 0.4);
    expect(fitted.segments.length).toBeLessThan(40);
    for (const p of samples(fitted)) expect(distanceToPolyline(p, poly, false)).toBeLessThan(0.6);
  });
});

describe("offset paths output", () => {
  it("offsets a circle to a true concentric curve with few segments", () => {
    const [circle] = evaluateShapeStack({ shapes: [{ type: "ellipse", size: [200, 200] }], frame: 0 });
    const out = offsetPath(circle.path, 20);
    expect(out.segments.length).toBeLessThanOrEqual(16);
    for (const p of samples(out)) expect(Math.abs(Math.hypot(p.x, p.y) - 120)).toBeLessThan(0.6);
  });

  it("insets an acute star without leaving self-intersection loops", () => {
    // Regression: the windowed loop removal missed the long swallowtails an
    // inward offset ties at a star's acute tips (reported by import-ae).
    const [star] = evaluateShapeStack({
      shapes: [{ type: "star", points: 5, outerRadius: 100, innerRadius: 40 }],
      frame: 0,
    });
    const inset = offsetPath(star.path, -20);
    const poly = samples(inset, 12);
    const crossings: string[] = [];
    for (let i = 0; i < poly.length; i += 1) {
      for (let j = i + 2; j < poly.length; j += 1) {
        if (i === 0 && j === poly.length - 1) continue;
        const [a, b, c, d] = [poly[i], poly[(i + 1) % poly.length], poly[j], poly[(j + 1) % poly.length]];
        const den = (b.x - a.x) * (d.y - c.y) - (b.y - a.y) * (d.x - c.x);
        if (Math.abs(den) < 1e-12) continue;
        const t = ((c.x - a.x) * (d.y - c.y) - (c.y - a.y) * (d.x - c.x)) / den;
        const u = ((c.x - a.x) * (b.y - a.y) - (c.y - a.y) * (b.x - a.x)) / den;
        if (t > 1e-6 && t < 1 - 1e-6 && u > 1e-6 && u < 1 - 1e-6) crossings.push(`${i}x${j}`);
      }
    }
    expect(crossings).toEqual([]);
    // Every point of the inset sits (about) 20px inside the star's outline.
    const outline = samples(star.path, 24);
    for (const p of poly) expect(distanceToPolyline(p, outline, true)).toBeGreaterThan(19);
  });

  it("falls back to a bevel when a corner exceeds the miter limit, as in AE", () => {
    // A 20-degree spike: its miter would reach 1/sin(10deg) = 5.8x the offset.
    const [spike] = parseD("M0 0 L200 35 L0 70 Z");
    const reach = (limit: number) => {
      const out = offsetPath(spike, 10, "miter", limit);
      return Math.max(...samples(out).map((p) => p.x)) - 200;
    };
    expect(reach(4)).toBeLessThan(10.5); // beveled: tip sits ~one offset past the vertex
    expect(reach(8)).toBeGreaterThan(50); // under the limit: the full miter spike
  });

  it("never pushes a zig-zag's outer offset further than the miter limit allows", () => {
    const [zig] = evaluateShapeStack({
      shapes: [{ type: "rect", size: [300, 300] }],
      operators: [
        { op: "zigzag", size: 18, ridges: 8, points: "corner" },
        { op: "offset", amount: 12, miterLimit: 4 },
      ],
      frame: 0,
    });
    const [source] = evaluateShapeStack({
      shapes: [{ type: "rect", size: [300, 300] }],
      operators: [{ op: "zigzag", size: 18, ridges: 8, points: "corner" }],
      frame: 0,
    });
    const poly = samples(source.path, 2);
    for (const p of samples(zig.path)) expect(distanceToPolyline(p, poly, true)).toBeLessThan(12 * 4 + 0.5);
  });
});
