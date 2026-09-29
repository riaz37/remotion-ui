import { describe, expect, it } from "vitest";
import {
  averageSpeed,
  easesFromHandles,
  handlesFor,
  handlesFromEases,
  isLinear,
  MIN_INFLUENCE,
  sameAcrossDimensions,
} from "./easing.js";

/** The value curve `ae-motion` draws for a scalar segment (its evaluateSegment). */
function aeScalarAt(a: number, b: number, seconds: number, out: { speed: number; influence: number }, inn: { speed: number; influence: number }, x: number) {
  const x1 = out.influence;
  const x2 = 1 - inn.influence;
  const bez = (p1: number, p2: number, u: number) => 3 * (1 - u) ** 2 * u * p1 + 3 * (1 - u) * u * u * p2 + u ** 3;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 60; i += 1) {
    const mid = (lo + hi) / 2;
    if (bez(x1, x2, mid) < x) lo = mid;
    else hi = mid;
  }
  const u = (lo + hi) / 2;
  const y1 = a + out.speed * out.influence * seconds;
  const y2 = b - inn.speed * inn.influence * seconds;
  const m = 1 - u;
  return m * m * m * a + 3 * m * m * u * y1 + 3 * m * u * u * y2 + u * u * u * b;
}

/** The value lottie-web computes: normalised cubic-bezier easing of a → b. */
function lottieAt(a: number, b: number, h: { ox: number; oy: number; ix: number; iy: number }, x: number) {
  const bez = (p1: number, p2: number, u: number) => 3 * (1 - u) ** 2 * u * p1 + 3 * (1 - u) * u * u * p2 + u ** 3;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 60; i += 1) {
    const mid = (lo + hi) / 2;
    if (bez(h.ox, h.ix, mid) < x) lo = mid;
    else hi = mid;
  }
  const u = (lo + hi) / 2;
  return a + (b - a) * bez(h.oy, h.iy, u);
}

describe("Lottie bezier → ae-motion speed/influence", () => {
  it("maps AE's Easy Ease (0.333, 0 / 0.667, 1) to speed 0, influence 1/3", () => {
    const { easeOut, easeIn } = easesFromHandles({ ox: 0.333, oy: 0, ix: 0.667, iy: 1 }, 120);
    expect(easeOut).toEqual({ speed: 0, influence: 0.333 });
    expect(easeIn.speed).toBe(0);
    expect(easeIn.influence).toBeCloseTo(0.333, 9);
  });

  it("encodes the handle heights as speed relative to the average", () => {
    const average = 300;
    const { easeOut, easeIn } = easesFromHandles({ ox: 0.2, oy: 0.6, ix: 0.5, iy: 0.9 }, average);
    expect(easeOut.influence).toBeCloseTo(0.2);
    expect(easeOut.speed).toBeCloseTo((0.6 / 0.2) * average);
    expect(easeIn.influence).toBeCloseTo(0.5);
    expect(easeIn.speed).toBeCloseTo((0.1 / 0.5) * average);
  });

  it("round-trips through the inverse to the same handles", () => {
    const h = { ox: 0.42, oy: -0.3, ix: 0.58, iy: 1.4 };
    const average = -75;
    const { easeOut, easeIn } = easesFromHandles(h, average);
    const back = handlesFromEases(easeOut, easeIn, average);
    for (const key of ["ox", "oy", "ix", "iy"] as const) expect(back[key]).toBeCloseTo(h[key], 9);
  });

  it("reproduces lottie-web's curve through ae-motion's scalar maths, overshoot included", () => {
    const cases = [
      { a: 0, b: 400, frames: 30, h: { ox: 0.333, oy: 0, ix: 0.667, iy: 1 } },
      { a: 100, b: -50, frames: 12, h: { ox: 0.17, oy: 0.67, ix: 0.83, iy: 0.33 } },
      { a: 10, b: 20, frames: 45, h: { ox: 0.5, oy: -0.4, ix: 0.3, iy: 1.6 } },
    ];
    const fps = 30;
    for (const { a, b, frames, h } of cases) {
      const seconds = frames / fps;
      const { easeOut, easeIn } = easesFromHandles(h, averageSpeed([a], [b], seconds));
      for (let k = 0; k <= 20; k += 1) {
        const x = k / 20;
        expect(aeScalarAt(a, b, seconds, easeOut, easeIn, x)).toBeCloseTo(lottieAt(a, b, h, x), 6);
      }
    }
  });

  it("clamps a zero influence to ae-motion's floor and keeps the handle height exact", () => {
    const { easeOut } = easesFromHandles({ ox: 0, oy: 0.5, ix: 1, iy: 1 }, 10);
    expect(easeOut.influence).toBe(MIN_INFLUENCE);
    expect((easeOut.speed / 10) * easeOut.influence).toBeCloseTo(0.5, 9);
  });

  it("measures vector segments by straight-line distance, scalars signed", () => {
    expect(averageSpeed([0, 0], [30, 40], 2)).toBe(25);
    expect(averageSpeed([10], [4], 2)).toBe(-3);
    expect(averageSpeed([1], [2], 0)).toBe(0);
  });

  it("recognises linear keys and per-dimension curves", () => {
    expect(isLinear({ ox: 0.167, oy: 0.167, ix: 0.833, iy: 0.833 })).toBe(true);
    expect(isLinear({ ox: 0.167, oy: 0, ix: 0.833, iy: 0.833 })).toBe(false);
    const o = { x: [0.2, 0.2], y: [0, 0.5] };
    const i = { x: [0.8, 0.8], y: [1, 1] };
    expect(sameAcrossDimensions(o, i, 2)).toBe(false);
    expect(handlesFor(o, i, 1)).toEqual({ ox: 0.2, oy: 0.5, ix: 0.8, iy: 1 });
    expect(sameAcrossDimensions({ x: [0.3], y: [0] }, { x: 0.7, y: 1 }, 2)).toBe(true);
  });

  it("treats a missing ease as linear", () => {
    expect(isLinear(handlesFor(undefined, undefined, 0))).toBe(true);
  });
});
