import { describe, expect, it } from "vitest";
import { ARM, IK_RIG_PLAN, IK_RIG_SETTLED, railBase } from "../components/previews/ik-rig";
import { previewMeta } from "./preview-config";
import { solveIkPose } from "../registry/bases/default/primitives/ik-rig";

/**
 * The ik-rig preview's claim is that the arm is exact: the ink is laid where
 * the pen target is, and the solved hand sits on that target on every frame.
 * These pin that claim, and the timing the docs player depends on.
 */
const FPS = 30;
const duration = previewMeta("ik-rig").durationInFrames;
const poses = Array.from({ length: duration }, (_, f) => solveIkPose({ ...ARM, base: railBase, plan: IK_RIG_PLAN }, f, FPS));
const turn = (a: number, b: number) => Math.abs((((a - b) % 360) + 540) % 360 - 180);

describe("ik-rig preview", () => {
  it("keeps the hand on the pen on every frame", () => {
    for (const pose of poses) {
      expect(Math.hypot(pose.hand[0] - pose.target[0], pose.hand[1] - pose.target[1])).toBeLessThan(1e-6);
    }
  });

  it("has no joint pops or flips: every joint turns under 12 degrees a frame", () => {
    for (let f = 1; f < poses.length; f += 1) {
      expect(turn(poses[f].upperAngle, poses[f - 1].upperAngle)).toBeLessThan(12);
      expect(turn(poses[f].lowerAngle, poses[f - 1].lowerAngle)).toBeLessThan(12);
    }
  });

  it("opens mid-word and settles with a hold before the clip ends", () => {
    expect(poses[0].ink.length).toBeGreaterThan(0);
    expect(poses[0].pen?.drawing).toBe(true);
    expect(IK_RIG_SETTLED).toBeLessThanOrEqual(duration - 15);
    const last = poses[duration - 1];
    expect(last.pen?.progress).toBe(1);
    expect(last.base).toEqual(poses[IK_RIG_SETTLED].base);
  });
});
