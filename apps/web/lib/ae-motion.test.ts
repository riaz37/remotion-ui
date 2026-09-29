import { describe, expect, it } from "vitest";
import {
  applyToPoint,
  decompose,
  EASY_EASE,
  easeToCubicBezier,
  easyEase,
  IDENTITY,
  invert,
  layerMatrix,
  multiply,
  noise1,
  noise3,
  orientAtFrame,
  resolveAnimatable,
  resolveParenting,
  sampleTrack,
  transformPower,
  valueAtTime,
  velocityAtFrame,
  wiggle,
  wiggleVec,
  type Keyframe,
  type Mat2D,
  type Vec2,
} from "../registry/bases/default/lib/ae-motion";

const close = (a: number, b: number, digits = 4) => expect(a).toBeCloseTo(b, digits);
const closeMat = (m: Mat2D, n: Mat2D) => m.forEach((v, i) => close(v, n[i]));

describe("keyframe tracks", () => {
  const linear: Keyframe[] = [
    { frame: 0, value: 0 },
    { frame: 30, value: 100 },
  ];

  it("interpolates linearly when no ease is given", () => {
    close(sampleTrack(linear, 15), 50);
    close(sampleTrack(linear, 3), 10);
  });

  it("holds the first and last value outside the keys", () => {
    expect(sampleTrack(linear, -10)).toBe(0);
    expect(sampleTrack(linear, 99)).toBe(100);
  });

  it("easy ease is a symmetric S-curve that starts slow", () => {
    const track = [easyEase(0, 0), easyEase(30, 100)];
    close(sampleTrack(track, 15), 50, 3);
    expect(sampleTrack(track, 5)).toBeLessThan(100 / 6);
    close(sampleTrack(track, 5) + sampleTrack(track, 25), 100, 3);
  });

  it("maps easy ease onto the familiar cubic-bezier handles", () => {
    const bezier = easeToCubicBezier(easyEase(0, 0), easyEase(30, 100));
    expect(bezier).not.toBeNull();
    const [x1, y1, x2, y2] = bezier!;
    close(x1, 1 / 3);
    close(y1, 0);
    close(x2, 2 / 3);
    close(y2, 1);
  });

  it("returns null bezier when the value does not change", () => {
    expect(easeToCubicBezier({ frame: 0, value: 5 }, { frame: 10, value: 5 })).toBeNull();
  });

  it("lets a scalar overshoot between equal keys through its speed handles", () => {
    const track: Keyframe[] = [
      { frame: 0, value: 0, easeOut: { speed: 600, influence: 0.5 } },
      { frame: 30, value: 0, easeIn: { speed: -600, influence: 0.5 } },
    ];
    expect(sampleTrack(track, 15)).toBeGreaterThan(50);
  });

  it("a fast outgoing speed front-loads the move", () => {
    const track: Keyframe[] = [
      { frame: 0, value: 0, easeOut: { speed: 900, influence: 0.6 } },
      { frame: 30, value: 100, easeIn: { speed: 0, influence: 0.6 } },
    ];
    expect(sampleTrack(track, 10)).toBeGreaterThan(55);
  });

  it("holds on hold keys", () => {
    const track: Keyframe[] = [
      { frame: 0, value: 1, interpolation: "hold" },
      { frame: 10, value: 2 },
    ];
    expect(sampleTrack(track, 9.9)).toBe(1);
    expect(sampleTrack(track, 10)).toBe(2);
  });

  it("interpolates vectors along a straight spatial path at the eased rate", () => {
    const track = [easyEase<Vec2>(0, [0, 0]), easyEase<Vec2>(20, [100, 50])];
    const mid = sampleTrack(track, 10);
    close(mid[0], 50, 3);
    close(mid[1], 25, 3);
    const early = sampleTrack(track, 4);
    close(early[1] / early[0], 0.5);
  });

  it("sorts keys and ignores authoring order", () => {
    const track: Keyframe[] = [
      { frame: 30, value: 100 },
      { frame: 0, value: 0 },
    ];
    close(sampleTrack(track, 15), 50);
  });

  it("rejects empty tracks and mixed dimensions", () => {
    expect(() => sampleTrack([], 0)).toThrow(/at least one key/);
    expect(() =>
      sampleTrack(
        [
          { frame: 0, value: [0, 0] },
          { frame: 10, value: [1] },
        ],
        5,
      ),
    ).toThrow(/dimensions/);
  });

  it("valueAtTime addresses the track in seconds", () => {
    close(valueAtTime(linear, 0.5, { fps: 30 }), 50);
    close(valueAtTime(linear, 0.5, { fps: 60 }), 100);
  });

  it("measures velocity in units per second", () => {
    close(velocityAtFrame(linear, 15, { fps: 30 })[0], 100, 2);
  });
});

describe("loops", () => {
  const ramp: Keyframe[] = [
    { frame: 0, value: 0 },
    { frame: 10, value: 10 },
  ];

  it("cycle repeats the keyed span", () => {
    close(sampleTrack(ramp, 15, { loopOut: "cycle" }), 5);
    close(sampleTrack(ramp, 27, { loopOut: "cycle" }), 7);
  });

  it("pingpong plays the span backwards, then forwards", () => {
    close(sampleTrack(ramp, 13, { loopOut: "pingpong" }), 7);
    close(sampleTrack(ramp, 23, { loopOut: "pingpong" }), 3);
  });

  it("offset carries the change forward every cycle", () => {
    close(sampleTrack(ramp, 15, { loopOut: "offset" }), 15);
    close(sampleTrack(ramp, 25, { loopOut: "offset" }), 25);
  });

  it("continue extrapolates the final velocity", () => {
    close(sampleTrack(ramp, 20, { loopOut: "continue" }), 20, 2);
  });

  it("loopIn mirrors loopOut before the first key", () => {
    close(sampleTrack(ramp, -5, { loopIn: "cycle" }), 5);
    close(sampleTrack(ramp, -5, { loopIn: "offset" }), -5);
  });

  it("loops only the last N segments when asked", () => {
    const track: Keyframe[] = [
      { frame: 0, value: 0 },
      { frame: 10, value: 100 },
      { frame: 20, value: 50 },
    ];
    close(sampleTrack(track, 25, { loopOut: { type: "cycle", keyframes: 1 } }), 75);
  });
});

describe("resolveAnimatable", () => {
  it("passes statics, samples tracks, calls expressions", () => {
    expect(resolveAnimatable(4, 10)).toBe(4);
    expect(resolveAnimatable([1, 2] as const, 10)).toEqual([1, 2]);
    close(resolveAnimatable([{ frame: 0, value: 0 }, { frame: 20, value: 10 }], 10), 5);
    expect(resolveAnimatable(({ time }) => time * 2, 15, { fps: 30 })).toBe(1);
  });
});

describe("noise and wiggle", () => {
  it("is deterministic", () => {
    expect(wiggle(2, 50, 7, 33)).toBe(wiggle(2, 50, 7, 33));
    expect(noise3(1.2, 3.4, 5.6, 9)).toBe(noise3(1.2, 3.4, 5.6, 9));
  });

  it("changes with the seed", () => {
    expect(wiggle(2, 50, 1, 33)).not.toBe(wiggle(2, 50, 2, 33));
  });

  it("stays within amplitude for one octave", () => {
    for (let frame = 0; frame < 600; frame += 1) {
      expect(Math.abs(wiggle(3, 40, 5, frame))).toBeLessThanOrEqual(40);
    }
  });

  it("is continuous frame to frame", () => {
    for (let frame = 0; frame < 300; frame += 1) {
      const step = Math.abs(wiggle(2, 100, 3, frame + 1) - wiggle(2, 100, 3, frame));
      expect(step).toBeLessThan(25);
    }
  });

  it("actually moves", () => {
    const values = Array.from({ length: 90 }, (_, frame) => wiggle(2, 100, 3, frame));
    expect(Math.max(...values) - Math.min(...values)).toBeGreaterThan(40);
  });

  it("gives each vector channel its own motion", () => {
    const [x, y] = wiggleVec(2, 2, 100, 3, 40);
    expect(x).not.toBe(y);
  });

  it("keeps noise1 and noise3 inside [-1, 1]", () => {
    for (let i = 0; i < 400; i += 1) {
      expect(Math.abs(noise1(i * 0.137, 4))).toBeLessThanOrEqual(1);
      expect(Math.abs(noise3(i * 0.31, i * 0.17, i * 0.07, 2))).toBeLessThanOrEqual(1);
    }
  });
});

describe("transforms and parenting", () => {
  it("multiplies and inverts back to identity", () => {
    const m = layerMatrix({ position: [40, 10], rotation: 33, scale: [2, 0.5], anchor: [5, 5] });
    closeMat(multiply(m, invert(m)), IDENTITY);
  });

  it("pins the anchor to the position", () => {
    const m = layerMatrix({ anchor: [50, 50], position: [200, 100], rotation: 45, scale: 3 });
    const [x, y] = applyToPoint(m, [50, 50]);
    close(x, 200);
    close(y, 100);
  });

  it("rotates clockwise on screen (y down)", () => {
    const [x, y] = applyToPoint(layerMatrix({ rotation: 90 }), [10, 0]);
    close(x, 0);
    close(y, 10);
  });

  it("carries children with a null parent", () => {
    const world = resolveParenting({
      null: { transform: { position: [100, 100], rotation: 90 } },
      child: { parent: "null", transform: { position: [50, 0] } },
      grandchild: { parent: "child", transform: { position: [10, 0], scale: 2 } },
    });
    const [x, y] = applyToPoint(world.child, [0, 0]);
    close(x, 100);
    close(y, 150);
    const decomposed = decompose(world.grandchild);
    close(decomposed.rotation, 90);
    close(decomposed.scale[0], 2);
    close(decomposed.position[0], 100);
    close(decomposed.position[1], 160);
  });

  it("reports parenting cycles and missing parents", () => {
    expect(() =>
      resolveParenting({
        a: { parent: "b", transform: {} },
        b: { parent: "a", transform: {} },
      }),
    ).toThrow(/cycle/);
    expect(() => resolveParenting({ a: { parent: "ghost", transform: {} } })).toThrow(/missing/);
  });

  it("compounds repeater steps and glides between them", () => {
    const step = { rotation: 90 };
    const [x2, y2] = applyToPoint(transformPower(step, 2), [10, 0]);
    close(x2, -10);
    close(y2, 0);
    const [xh, yh] = applyToPoint(transformPower(step, 0.5), [10, 0]);
    close(Math.hypot(xh, yh), 10);
    close(Math.atan2(yh, xh) * (180 / Math.PI), 45);
    closeMat(transformPower(step, 0), IDENTITY);
  });

  it("uses the repeater anchor as a pivot, not an offset", () => {
    const [x, y] = applyToPoint(transformPower({ anchor: [0, 100], rotation: 180 }, 1), [0, 0]);
    close(x, 0);
    close(y, 200);
    closeMat(transformPower({ anchor: [0, 100] }, 3), IDENTITY);
  });

  it("inverts negative repeater powers", () => {
    const m = transformPower({ position: [10, 0], rotation: 30, scale: 1.1 }, -2);
    const back = transformPower({ position: [10, 0], rotation: 30, scale: 1.1 }, 2);
    closeMat(multiply(m, back), IDENTITY);
  });

  it("exposes the easy-ease constant", () => {
    expect(EASY_EASE.speed).toBe(0);
  });
});

describe("spatial bézier handles", () => {
  // An arc from (0,0) to (100,100), symmetric about its own midpoint.
  const arc: Keyframe<Vec2>[] = [
    { frame: 0, value: [0, 0], spatialOut: [55, 0], interpolation: "linear" },
    { frame: 30, value: [100, 100], spatialIn: [0, -55] },
  ];

  it("travels the curve, not the chord", () => {
    const [x, y] = sampleTrack(arc, 15);
    expect(x).toBeCloseTo(70.6, 0);
    expect(y).toBeCloseTo(29.4, 0);
    expect(sampleTrack(arc, 0)).toEqual([0, 0]);
    expect(sampleTrack(arc, 30)).toEqual([100, 100]);
  });

  it("moves at constant speed along the curve under linear timing", () => {
    const steps = Array.from({ length: 30 }, (_, f) => {
      const [x0, y0] = sampleTrack(arc, f);
      const [x1, y1] = sampleTrack(arc, f + 1);
      return Math.hypot(x1 - x0, y1 - y0);
    });
    const mean = steps.reduce((a, b) => a + b, 0) / steps.length;
    steps.forEach((step) => expect(Math.abs(step - mean) / mean).toBeLessThan(0.02));
  });

  it("measures easing along the path", () => {
    const eased = arc.map((key) => ({ ...key, interpolation: undefined, easeIn: EASY_EASE, easeOut: EASY_EASE }));
    const early = sampleTrack(eased, 3);
    const late = sampleTrack(eased, 27);
    // Symmetric curve + symmetric ease: early and late mirror each other.
    expect(early[0] + late[1]).toBeCloseTo(100, 1);
    expect(Math.hypot(early[0], early[1])).toBeLessThan(10);
  });

  it("auto-orients along the path and holds through ease stops", () => {
    const eased = arc.map((key) => ({ ...key, easeIn: EASY_EASE, easeOut: EASY_EASE }));
    close(orientAtFrame(eased, 0), 0, 2);
    close(orientAtFrame(eased, 30), 90, 2);
    close(orientAtFrame(eased, 15), 45, 1);
    close(orientAtFrame(eased, -20), 0, 2);
    close(orientAtFrame(eased, 99), 90, 2);
  });

  it("orients straight segments along their chord", () => {
    close(orientAtFrame([easyEase<Vec2>(0, [0, 0]), easyEase<Vec2>(10, [0, 100])], 5), 90);
  });

  it("ignores zero tangents", () => {
    const flat: Keyframe<Vec2>[] = [
      { frame: 0, value: [0, 0], spatialOut: [0, 0], interpolation: "linear" },
      { frame: 10, value: [100, 0] },
    ];
    close(sampleTrack(flat, 5)[0], 50);
  });
});
