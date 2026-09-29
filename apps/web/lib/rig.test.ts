import { describe, expect, it } from "vitest";
import { parseD, pathLength, sampleAtLength } from "../registry/bases/default/lib/bezier-path";
import { rubberHose, softReach, solveTwoBone } from "../registry/bases/default/lib/rig";

const dist = (a: readonly number[], b: readonly number[]) => Math.hypot(a[0] - b[0], a[1] - b[1]);

describe("solveTwoBone", () => {
  it("reaches a reachable target with bones of the right length", () => {
    const s = solveTwoBone([0, 0], [120, 40], [100, 80]);
    expect(dist(s.end, [120, 40])).toBeLessThan(1e-6);
    expect(dist(s.root, s.joint)).toBeCloseTo(100);
    expect(dist(s.joint, s.end)).toBeCloseTo(80);
    expect(s.reached).toBe(true);
  });

  it("bends to the requested side", () => {
    const down = solveTwoBone([0, 0], [100, 0], [80, 80], { bend: 1 });
    const up = solveTwoBone([0, 0], [100, 0], [80, 80], { bend: -1 });
    expect(down.joint[1]).toBeGreaterThan(0);
    expect(up.joint[1]).toBeLessThan(0);
    expect(down.joint[0]).toBeCloseTo(up.joint[0]);
  });

  it("points straight at a target out of reach, or stretches to it", () => {
    const short = solveTwoBone([0, 0], [300, 0], [100, 80]);
    expect(short.reached).toBe(false);
    expect(short.end[0]).toBeCloseTo(180, 3);
    expect(Math.abs(short.joint[1])).toBeLessThan(0.01);
    const long = solveTwoBone([0, 0], [300, 0], [100, 80], { stretch: true, maxStretch: 2 });
    expect(long.reached).toBe(true);
    expect(long.stretch).toBeCloseTo(300 / 180);
    const capped = solveTwoBone([0, 0], [900, 0], [100, 80], { stretch: true, maxStretch: 1.5 });
    expect(capped.stretch).toBe(1.5);
  });

  it("never folds the joint through the root", () => {
    const s = solveTwoBone([0, 0], [1, 0], [100, 60]);
    expect(Number.isFinite(s.joint[0])).toBe(true);
    expect(dist(s.root, s.end)).toBeGreaterThanOrEqual(40 - 1e-3);
  });

  it("rejects non-positive bones", () => {
    expect(() => solveTwoBone([0, 0], [1, 1], [0, 10])).toThrow(/positive/);
  });
});

describe("rubberHose", () => {
  it("keeps its length and bows as the ends close in", () => {
    for (const chord of [60, 120, 180]) {
      const hose = rubberHose([0, 0], [chord, 0], 200, { bend: 1 });
      const [path] = parseD(hose.d);
      expect(pathLength(path)).toBeCloseTo(200, 0);
      // The arc really passes through the reported apex, on the bend side.
      const mid = sampleAtLength(path, 100);
      expect(dist([mid.x, mid.y], hose.apex)).toBeLessThan(0.5);
      expect(hose.apex[1]).toBeGreaterThan(0);
    }
  });

  it("bows the other way for bend -1", () => {
    expect(rubberHose([0, 0], [100, 0], 200, { bend: -1 }).apex[1]).toBeLessThan(0);
  });

  it("curls past a half circle when the ends are very close", () => {
    const hose = rubberHose([0, 0], [20, 0], 200);
    const [path] = parseD(hose.d);
    expect(pathLength(path)).toBeCloseTo(200, 0);
    expect(hose.apex[1]).toBeGreaterThan(50);
  });

  it("goes straight at full length, and stretches only when asked", () => {
    const taut = rubberHose([0, 0], [300, 0], 200);
    expect(taut.radius).toBe(Infinity);
    expect(taut.end[0]).toBeCloseTo(200);
    expect(rubberHose([0, 0], [300, 0], 200, { stretch: true }).end[0]).toBeCloseTo(300);
  });

  it("reports tangent angles at both ends", () => {
    const hose = rubberHose([0, 0], [100, 0], 200, { bend: 1 });
    expect(hose.startAngle).toBeGreaterThan(0);
    expect(hose.endAngle).toBeLessThan(0);
    expect(hose.startAngle).toBeCloseTo(-hose.endAngle);
  });
});

describe("soft IK", () => {
  it("passes short distances through and approaches full length without reaching it", () => {
    expect(softReach(50, 100, 0.2)).toBe(50);
    expect(softReach(80, 100, 0.2)).toBe(80);
    expect(softReach(100, 100, 0.2)).toBeLessThan(100);
    expect(softReach(1e6, 100, 0.2)).toBeCloseTo(100, 6);
    expect(softReach(150, 100, 0)).toBe(100);
  });

  it("never pops the joint straight as a target runs out of reach", () => {
    // Hard IK: the elbow angle's rate blows up at full extension. Soft IK keeps it bounded.
    const step = (softness: number) => {
      let worst = 0;
      let prev = solveTwoBone([0, 0], [150, 0], [100, 80], { softness }).upperAngle;
      for (let x = 150.1; x <= 220; x += 0.1) {
        const a = solveTwoBone([0, 0], [x, 0], [100, 80], { softness }).upperAngle;
        worst = Math.max(worst, Math.abs(a - prev));
        prev = a;
      }
      return worst;
    };
    expect(step(0.1)).toBeLessThan(0.3);
    expect(step(0)).toBeGreaterThan(5 * step(0.1));
  });

  it("lands on the target when soft and stretchy", () => {
    const s = solveTwoBone([0, 0], [175, 0], [100, 80], { softness: 0.1, stretch: true });
    expect(s.end[0]).toBeCloseTo(175, 6);
    expect(s.stretch).toBeGreaterThan(1);
  });
});
