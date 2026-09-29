import { describe, expect, it } from "vitest";
import { easyEase, type Keyframe, type Vec2 } from "../registry/bases/default/lib/ae-motion";
import { followChain } from "../registry/bases/default/lib/follow";

// A leader that jumps across and stops dead at frame 20.
const dash: Keyframe<Vec2>[] = [
  { frame: 0, value: [0, 0], interpolation: "linear" },
  { frame: 20, value: [300, 0] },
];

describe("followChain", () => {
  it("returns the leader as link 0 and starts every link on it", () => {
    const states = followChain(dash, 0, { links: 3 });
    expect(states).toHaveLength(4);
    states.forEach((s) => expect(s.position).toEqual([0, 0]));
    expect(followChain(dash, 10, { links: 3 })[0].position[0]).toBeCloseTo(150);
  });

  it("lags behind the leader, each link further than the last", () => {
    const [leader, a, b, c] = followChain(dash, 12, { links: 3, damping: 1 });
    expect(a.position[0]).toBeLessThan(leader.position[0]);
    expect(b.position[0]).toBeLessThan(a.position[0]);
    expect(c.position[0]).toBeLessThan(b.position[0]);
  });

  it("overshoots and settles when underdamped", () => {
    const xs = Array.from({ length: 140 }, (_, f) => followChain(dash, f, { links: 1, damping: 0.3 })[1].position[0]);
    expect(Math.max(...xs)).toBeGreaterThan(310);
    expect(xs[139]).toBeCloseTo(300, 0);
  });

  it("does not overshoot when critically damped", () => {
    const xs = Array.from({ length: 140 }, (_, f) => followChain(dash, f, { links: 1, damping: 1 })[1].position[0]);
    expect(Math.max(...xs)).toBeLessThanOrEqual(300.5);
  });

  it("is deterministic and independent of render order", () => {
    const track = [easyEase<Vec2>(0, [0, 0]), easyEase<Vec2>(30, [200, 100])];
    const forward = Array.from({ length: 40 }, (_, f) => followChain(track, f, { links: 2 })[2].position);
    const freshTrack = [easyEase<Vec2>(0, [0, 0]), easyEase<Vec2>(30, [200, 100])];
    const backward = Array.from({ length: 40 }, (_, k) => 39 - k).map((f) => followChain(freshTrack, f, { links: 2 })[2].position);
    backward.reverse();
    forward.forEach((p, f) => {
      expect(p[0]).toBeCloseTo(backward[f][0], 10);
      expect(p[1]).toBeCloseTo(backward[f][1], 10);
    });
  });

  it("delay makes a link chase where the one ahead was, frames ago", () => {
    const options = { links: 1, frequency: 6, damping: 1 };
    const prompt = followChain(dash, 15, options)[1].position[0];
    const delayed = followChain(dash, 15, { ...options, delay: 10 })[1].position[0];
    // The leader was at 75 ten frames earlier; the delayed link is near there.
    expect(delayed).toBeLessThan(prompt - 60);
    expect(delayed).toBeLessThan(90);
    // And it still arrives in the end.
    expect(followChain(dash, 120, { ...options, delay: 10 })[1].position[0]).toBeCloseTo(300, 0);
  });

  it("follows expressions as well as tracks, lagging behind in angle", () => {
    const circle = ({ time }: { time: number }): Vec2 => [Math.cos(time) * 100, Math.sin(time) * 100];
    const [leader, link] = followChain(circle, 30, { links: 1 });
    expect(leader.position[0]).toBeCloseTo(Math.cos(1) * 100);
    const angle = (p: Vec2) => Math.atan2(p[1], p[0]);
    expect(angle(link.position)).toBeLessThan(angle(leader.position));
  });

  it("reports headings", () => {
    const [, a] = followChain(dash, 8, { links: 1, damping: 1 });
    expect(a.angle).toBeCloseTo(0, 0);
    expect(a.toPrevious).toBeCloseTo(0, 0);
  });

  it("rejects bad options", () => {
    expect(() => followChain(dash, 1, { links: -1 })).toThrow(/links/);
    expect(() => followChain(dash, 1, { links: 1, frequency: 0 })).toThrow(/frequency/);
  });
});
