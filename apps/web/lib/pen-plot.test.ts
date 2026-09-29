import { describe, expect, it } from "vitest";
import { backInOut, inkAt, penAt, planPlot } from "../registry/bases/default/lib/pen-plot";
import { parseD, pathLength, sampleAtLength } from "../registry/bases/default/lib/bezier-path";

const dist = (a: readonly number[], b: readonly number[]) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const speedAt = (plan: ReturnType<typeof planPlot>, f: number) =>
  dist(penAt(plan, f + 0.01).position, penAt(plan, f - 0.01).position) / 0.02;

describe("planPlot / penAt", () => {
  const plan = planPlot(["M0 0 L200 0 L200 100", "M300 0 C340 -40 380 40 420 0"], { speed: 600, travelSpeed: 900 }, 30);

  it("lays every stroke in order, with lifts and a travel between them", () => {
    expect(plan.phases.map((p) => p.kind)).toEqual(["lower", "draw", "raise", "travel", "lower", "draw", "raise"]);
    expect(plan.lengths[0]).toBeCloseTo(300, 3);
  });

  it("keeps the pen exactly on the stroke while it draws", () => {
    const draw = plan.phases.find((p) => p.kind === "draw")!;
    const [path] = parseD("M0 0 L200 0 L200 100");
    for (let f = draw.t0; f <= draw.t1; f += 0.5) {
      const pen = penAt(plan, f);
      expect(pen.lift).toBe(0);
      const along = pen.inked;
      const s = sampleAtLength(path, along);
      expect(dist(pen.position, [s.x, s.y])).toBeLessThan(1e-6);
    }
  });

  it("cruises at the requested speed and brakes to a stop in a sharp corner", () => {
    const draw = plan.phases.find((p) => p.kind === "draw")!;
    const speeds = Array.from({ length: Math.floor(draw.t1 - draw.t0) - 1 }, (_, i) => speedAt(plan, draw.t0 + 1 + i));
    expect(Math.max(...speeds)).toBeLessThanOrEqual(20 + 1e-6); // 600 px/s at 30 fps
    // Find the frame the pen reaches the corner at (200, 0): it is at rest there.
    let corner = draw.t0;
    while (penAt(plan, corner).inked < 200 - 1e-6) corner += 0.05;
    expect(speedAt(plan, corner)).toBeLessThan(0.5);
  });

  it("peaks at travelSpeed on pen-up moves, with anticipation and a settle", () => {
    const travel = plan.phases.find((p) => p.kind === "travel")!;
    let peak = 0;
    for (let f = travel.t0; f <= travel.t1; f += 0.25) peak = Math.max(peak, speedAt(plan, f));
    expect(peak).toBeLessThanOrEqual(900 / 30 + 0.2);
    expect(peak).toBeGreaterThan(900 / 30 - 1);
    expect(backInOut(0.1, 1.2)).toBeLessThan(0); // pulls back first
    expect(backInOut(0.9, 1.2)).toBeGreaterThan(1); // overshoots
    expect(backInOut(1, 1.2)).toBe(1);
    expect(speedAt(plan, travel.t1 - 0.02)).toBeLessThan(0.5);
  });

  it("puts the ink end exactly under the pen, and the whole plot on the paper at the end", () => {
    const draw = plan.phases.filter((p) => p.kind === "draw")[1];
    const f = (draw.t0 + draw.t1) / 2;
    const ink = inkAt(plan, f);
    expect(ink).toHaveLength(2);
    const [partial] = parseD(ink[1]);
    const end = sampleAtLength(partial, pathLength(partial));
    expect(dist([end.x, end.y], penAt(plan, f).position)).toBeLessThan(1e-3);
    expect(inkAt(plan, plan.end + 10)).toEqual(plan.strokeD);
    expect(penAt(plan, plan.end + 10).progress).toBe(1);
  });

  it("rests raised before the start and can open mid-drawing", () => {
    expect(penAt(plan, -5)).toMatchObject({ lift: 1, drawing: false, stroke: -1 });
    const late = planPlot("M0 0 L300 0", { startFrame: -10 }, 30);
    expect(penAt(late, 0).drawing).toBe(true);
    expect(inkAt(late, 0)).toHaveLength(1);
  });

  it("is a pure function of the frame", () => {
    const a = penAt(plan, 23.7);
    penAt(plan, 3);
    expect(penAt(plan, 23.7)).toEqual(a);
  });

  it("rejects empty strokes and non-positive speeds", () => {
    expect(() => planPlot("")).toThrow(/no drawable/);
    expect(() => planPlot("M0 0 L1 1", { speed: 0 })).toThrow(/positive/);
  });
});
