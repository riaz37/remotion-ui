import { describe, expect, it } from "vitest";
import { slitGroups } from "../registry/bases/default/lib/slit-geometry";

const base = { width: 400, height: 200, maxDelay: 30 };

describe("slitGroups", () => {
  it("covers every strip exactly once", () => {
    const groups = slitGroups({ ...base, strips: 40, levels: 8 });
    expect(groups.reduce((sum, g) => sum + g.strips, 0)).toBe(40);
  });

  it("caps renders at the number of levels, whatever the strip count", () => {
    const groups = slitGroups({ ...base, strips: 200, levels: 12 });
    expect(groups.length).toBeLessThanOrEqual(12);
    expect(groups[0].delay).toBe(0);
    expect(groups[groups.length - 1].delay).toBe(30);
  });

  it("spaces delays evenly across the range", () => {
    const delays = slitGroups({ ...base, strips: 5, levels: 5 }).map((g) => g.delay);
    // Fractional, so a fast-moving child does not step between strips.
    expect(delays).toEqual([0, 7.5, 15, 22.5, 30]);
  });

  it("follows a custom curve", () => {
    // 11 levels put 0.5 exactly on a level (10 would quantise it to 5/9).
    const flat = slitGroups({ ...base, strips: 10, levels: 11, curve: () => 0.5 });
    expect(flat).toHaveLength(1);
    expect(flat[0].delay).toBe(15);
  });

  it("emits valid clip paths for bands and rings", () => {
    const bands = slitGroups({ ...base, strips: 4, levels: 4, angle: 90 });
    bands.forEach((g) => expect(g.clipPath).toMatch(/^path\(evenodd, "M[\d\s.LZ-]+"\)$/));
    const rings = slitGroups({ ...base, mode: "radial", strips: 3, levels: 3 });
    // The centre disc has no inner circle; outer rings are two circles each.
    expect(rings[0].clipPath.match(/M/g)).toHaveLength(1);
    expect(rings[2].clipPath.match(/A/g)).toHaveLength(4);
  });

  it("rotated bands span the whole frame along the delay axis", () => {
    // At 0 degrees the first band starts at the left edge.
    const [first] = slitGroups({ ...base, strips: 4, levels: 4, angle: 0 });
    expect(first.clipPath).toContain("M0 ");
  });

  it("rejects nonsense sizes", () => {
    expect(() => slitGroups({ ...base, width: 0 })).toThrow(/positive/);
    expect(() => slitGroups({ ...base, strips: 0 })).toThrow(/strips/);
  });
});
